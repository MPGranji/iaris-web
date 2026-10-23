import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { once } from "node:events";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import path from "node:path";
import type { Server } from "node:http";
import type { PrismaClient } from "@prisma/client";
import type { AdminBootstrap } from "../../shared/admin-access";
import type { DemoRecord } from "../../shared/admin-demo";
import type { SiteContent } from "../../shared/types";
import { schemaFor } from "../../shared/admin-schema";
import { createServer as createSmtpServer, type Socket } from "node:net";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import os from "node:os";

const root = path.resolve(__dirname, "../..");
const requireFromTest = createRequire(__filename);
const schema = `test_integration_${randomBytes(8).toString("hex")}`;
const origin = "http://127.0.0.1:5176";
const password = randomBytes(24).toString("hex");
let base = "",
  cookie = "",
  server: Server,
  db: PrismaClient;
let bootstrap: AdminBootstrap;
async function request(
  route: string,
  method = "GET",
  body?: unknown,
  session = cookie,
  requestOrigin = origin,
) {
  return fetch(base + route, {
    method,
    headers: {
      ...(session ? { Cookie: session } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(requestOrigin ? { Origin: requestOrigin } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function workspace(session = cookie) {
  const response = await request("/admin/bootstrap", "GET", undefined, session);
  assert.equal(response.status, 200);
  return (await response.json()) as AdminBootstrap;
}
async function save(collection: string, row: DemoRecord, session = cookie) {
  const latest = await workspace(session);
  const response = await request(
    `/admin/records/${collection}/${row.id}`,
    "PUT",
    { row, revision: latest.revision },
    session,
  );
  assert.equal(response.status, 200, await response.clone().text());
  return (await response.json()) as AdminBootstrap;
}
async function publish() {
  const latest = await workspace();
  const response = await request("/admin/publish", "POST", {
    label: "Integration test",
    revision: latest.revision,
  });
  assert.equal(response.status, 200, await response.clone().text());
}
async function signIn(email: string, loginPassword: string) {
  const response = await request(
    "/admin/login",
    "POST",
    { email, password: loginPassword },
    "",
  );
  assert.equal(response.status, 200, await response.clone().text());
  return response;
}
before(async () => {
  process.loadEnvFile(path.join(root, "backend/.env"));
  const connection = new URL(process.env.DATABASE_URL!);
  assert.equal(connection.hostname, "127.0.0.1");
  assert.equal(connection.port, "5441");
  assert.equal(connection.pathname, "/iaris_dev");
  connection.searchParams.set("schema", schema);
  process.env.DATABASE_URL = connection.toString();
  process.env.NODE_ENV = "test";
  process.env.DEMO_ADMIN_LOGIN = "false";
  // Never use real SMTP credentials or recipients from the developer's .env in tests.
  process.env.MAIL_MODE = "preview";
  process.env.MAIL_FROM = "sender@example.com";
  process.env.MAIL_REPLY_TO = "owner@example.com";
  process.env.CONSULTATION_TO = "owner@example.com";
  process.env.SMTP_HOST = "";
  process.env.SMTP_USER = "";
  process.env.SMTP_PASSWORD = "";
  process.env.BOOTSTRAP_ADMIN_EMAIL = "integration-admin@example.com";
  process.env.BOOTSTRAP_ADMIN_PASSWORD = password;
  execFileSync(
    process.execPath,
    [
      requireFromTest.resolve("prisma/build/index.js"),
      "migrate",
      "deploy",
      "--schema",
      "backend/prisma/schema.prisma",
    ],
    { cwd: root, env: process.env, stdio: "pipe", windowsHide: true },
  );
  execFileSync(
    process.execPath,
    ["--import", "tsx", "backend/prisma/seed.ts"],
    { cwd: root, env: process.env, stdio: "pipe", windowsHide: true },
  );
  const { default: app } = await import("../src/app");
  db = (await import("../src/lib/prisma")).prisma!;
  server = app.listen(0, "127.0.0.1");
  if (!server.listening) await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}/api`;
});
after(async () => {
  if (server)
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  if (db) {
    assert.match(schema, /^test_integration_[a-f0-9]{16}$/);
    await db.$executeRawUnsafe(`DROP SCHEMA "${schema}" CASCADE`);
    await db.$disconnect();
  }
});

test("admin authentication rejects missing session and cross-origin writes; cookie is protected", async () => {
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, "")).status,
    401,
  );
  assert.equal(
    (
      await request(
        "/admin/login",
        "POST",
        { email: "integration-admin@example.com", password },
        "",
        "https://untrusted.example",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/admin/login",
        "POST",
        { email: "integration-admin@example.com", password },
        "",
        "http://127.0.0.1:5175",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/admin/login",
        "POST",
        { email: "integration-admin@example.com", password },
        "",
        "",
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/admin/login",
        "POST",
        { email: "integration-admin@example.com", password: "incorrect" },
        "",
      )
    ).status,
    401,
  );
  const response = await signIn("integration-admin@example.com", password);
  const header = response.headers.get("set-cookie")!;
  assert.match(header, /HttpOnly/i);
  assert.match(header, /SameSite=Strict/i);
  assert.match(header, /Path=\/api\/admin/i);
  cookie = header.split(";")[0];
  bootstrap = (await response.json()) as AdminBootstrap;
  assert.equal(bootstrap.workspace.data.members.length, 1);
  assert.ok(!JSON.stringify(bootstrap).includes("passwordHash"));
});

test("draft saves stay private until publish and stale concurrent writes are rejected", async () => {
  const row = bootstrap.workspace.data.courses[0];
  const beforeContent = (await (
    await request("/content")
  ).json()) as SiteContent;
  const changed = await save("courses", {
    ...row,
    title: "Updated through admin API",
  });
  assert.equal(
    ((await (await request("/content")).json()) as SiteContent).courses[0]
      .title,
    beforeContent.courses[0].title,
  );
  const stale = await request(`/admin/records/courses/${row.id}`, "PUT", {
    row: { ...row, title: "Stale overwrite" },
    revision: bootstrap.revision,
  });
  assert.equal(stale.status, 409);
  assert.equal(
    (await workspace()).workspace.data.courses[0].title,
    "Updated through admin API",
  );
  await publish();
  const content = (await (await request("/content")).json()) as SiteContent;
  assert.equal(content.courses[0].title, "Updated through admin API");
  assert.equal(
    (await (await request("/courses")).json())[0].title,
    content.courses[0].title,
  );
  assert.ok(!JSON.stringify(content).includes("integration-admin@example.com"));
  assert.ok(!("leads" in content));
  assert.ok(!("members" in content));
  assert.ok(changed.revision > bootstrap.revision);
});

test("website settings publish through the same database and seed never overwrites edits", async () => {
  const current = await workspace();
  const hero = current.workspace.data.website.find((r) => r.id === "hero")!;
  await save("website", { ...hero, title: "Published hero from admin" });
  await publish();
  assert.equal(
    ((await (await request("/content")).json()) as SiteContent).settings?.hero
      .title,
    "Published hero from admin",
  );
  execFileSync(
    process.execPath,
    ["--import", "tsx", "backend/prisma/seed.ts"],
    { cwd: root, env: process.env, stdio: "pipe", windowsHide: true },
  );
  assert.equal(
    (await workspace()).workspace.data.courses[0].title,
    "Updated through admin API",
  );
  assert.equal(
    (await workspace()).workspace.data.website.find((r) => r.id === "hero")
      ?.title,
    "Published hero from admin",
  );
});

test("all content collections save with server validation and invalid writes roll back", async () => {
  for (const collection of [
    "laws",
    "tiers",
    "programs",
    "media",
    "events",
    "lessons",
  ] as const) {
    const current = await workspace();
    await save(collection, current.workspace.data[collection][0]);
  }
  const current = await workspace();
  const row = current.workspace.data.laws[0];
  const response = await request(`/admin/records/laws/${row.id}`, "PUT", {
    row: { ...row, effectiveDate: "2026-02-30" },
    revision: current.revision,
  });
  assert.equal(response.status, 400);
  assert.equal((await workspace()).revision, current.revision);
  assert.equal(
    (await workspace()).workspace.data.laws[0].effectiveDate,
    row.effectiveDate,
  );
  const event = current.workspace.data.events[0];
  const invalidEvent = await request(
    `/admin/records/events/${event.id}`,
    "PUT",
    { row: { ...event, startsAt: "2026-02-30" }, revision: current.revision },
  );
  assert.equal(invalidEvent.status, 400);
  assert.equal((await workspace()).revision, current.revision);
  const duplicate = {
    ...current.workspace.data.courses[0],
    id: "duplicate-course",
  };
  assert.equal(
    (
      await request("/admin/records/courses/duplicate-course", "PUT", {
        row: duplicate,
        revision: current.revision,
      })
    ).status,
    400,
  );
});

test("website leads arrive in admin, status and notes persist, publication excludes private data", async () => {
  const response = await request(
    "/leads",
    "POST",
    {
      fullName: "Integration lead",
      organization: "Sandbox Company",
      email: "integration-lead@example.com",
      interests: ["FOUNDATION"],
      message: "Private consultation content",
    },
    "",
  );
  assert.equal(response.status, 201);
  const lead = (await response.json()) as { id: string; stored: boolean };
  assert.equal(lead.stored, true);
  assert.match(lead.id, /^YC-\d{8}-\d{6}-KH-[A-F0-9]{12}$/);
  const row = (await workspace()).workspace.data.leads.find(
    (r) => r.id === lead.id,
  )!;
  assert.ok(row);
  assert.equal(row.requestCode, lead.id);
  await save("leads", {
    ...row,
    status: "CONTACTED",
    note: "Internal note only",
  });
  const stored = await db.lead.findUniqueOrThrow({ where: { id: lead.id } });
  assert.equal(stored.status, "CONTACTED");
  assert.equal(stored.note, "Internal note only");
  await publish();
  const publicData = JSON.stringify(await (await request("/content")).json());
  for (const privateText of [
    "integration-lead@example.com",
    "Internal note only",
    "Private consultation content",
  ])
    assert.ok(!publicData.includes(privateText));
});

test("role permissions are enforced server-side and locked accounts lose sessions", async () => {
  await save("members", {
    id: "integration-editor",
    name: "Editor",
    email: "editor@example.com",
    role: "editor",
    status: "active",
    password,
  });
  await save("members", {
    id: "integration-advisor",
    name: "Advisor",
    email: "advisor@example.com",
    role: "advisor",
    status: "active",
    password,
  });
  const editorCookie = (await signIn("editor@example.com", password)).headers
    .get("set-cookie")!
    .split(";")[0];
  const advisorCookie = (await signIn("advisor@example.com", password)).headers
    .get("set-cookie")!
    .split(";")[0];
  const editor = await workspace(editorCookie);
  const privateLead = (await workspace()).workspace.data.leads[0];
  assert.equal(
    (
      await request(
        `/admin/leads/${privateLead.id}/emails`,
        "GET",
        undefined,
        editorCookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        `/admin/leads/${privateLead.id}/emails`,
        "GET",
        undefined,
        advisorCookie,
      )
    ).status,
    200,
  );
  assert.deepEqual(editor.workspace.data.leads, []);
  assert.deepEqual(editor.workspace.data.members, []);
  const advisor = await workspace(advisorCookie);
  assert.deepEqual(advisor.workspace.data.courses, []);
  assert.deepEqual(advisor.workspace.publications, []);
  assert.ok(advisor.workspace.data.leads.length);
  const lead = (await workspace()).workspace.data.leads[0];
  assert.equal(
    (
      await request(
        `/admin/records/leads/${lead.id}`,
        "PUT",
        {
          row: { ...lead, status: "SPAM", note: "" },
          revision: editor.revision,
        },
        editorCookie,
      )
    ).status,
    403,
  );
  const course = (await workspace()).workspace.data.courses[0];
  assert.equal(
    (
      await request(
        `/admin/records/courses/${course.id}`,
        "PUT",
        { row: course, revision: advisor.revision },
        advisorCookie,
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        "/admin/publish",
        "POST",
        { label: "Forbidden", revision: advisor.revision },
        advisorCookie,
      )
    ).status,
    403,
  );
  await save(
    "leads",
    { ...lead, status: "QUALIFIED", note: "Updated by advisor" },
    advisorCookie,
  );
  const own = (await workspace()).workspace.data.members.find(
    (m) => m.id === bootstrap.user.id,
  )!;
  const selfLock = await request(`/admin/records/members/${own.id}`, "PUT", {
    row: { ...own, status: "inactive" },
    revision: (await workspace()).revision,
  });
  assert.equal(selfLock.status, 400);
  const member = (await workspace()).workspace.data.members.find(
    (m) => m.id === "integration-advisor",
  )!;
  await save("members", { ...member, status: "inactive" });
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, advisorCookie)).status,
    401,
  );
  assert.equal(
    (
      await request(
        "/admin/login",
        "POST",
        { email: "advisor@example.com", password },
        "",
      )
    ).status,
    401,
  );
});

test("public quiz scoring uses published answers, not unpublished edits, and stores history", async () => {
  const current = await workspace();
  const questions = current.workspace.data.quiz;
  const answers = questions.map((q) => Number(q.correctIndex));
  const first = questions[0];
  await save("quiz", {
    ...first,
    correctIndex:
      (Number(first.correctIndex) + 1) % (first.options as string[]).length,
  });
  const response = await request(
    "/quiz-attempts",
    "POST",
    { courseCode: "B6", answers },
    "",
  );
  assert.equal(response.status, 201);
  const result = (await response.json()) as { score: number; stored: boolean };
  assert.equal(result.score, questions.length);
  assert.equal(result.stored, true);
  const history = (await workspace()).workspace.attempts;
  assert.equal(history[0].correct, questions.length);
  assert.ok(
    (await db.quizAttempt.findUniqueOrThrow({ where: { id: history[0].id } }))
      .questions,
  );
});

test("consultation mail previews have correct recipients, reply routing, escaped content and no duplicate submission", async () => {
  const submissionKey = crypto.randomUUID();
  const payload = {
    submissionKey,
    fullName: "Khách <script>alert(1)</script>",
    organization: "Sandbox Company",
    email: "mail-preview@example.com",
    interests: ["FOUNDATION"],
    message: "Tư vấn <img src=x onerror=alert(1)>",
  };
  const responses = await Promise.all([
    request("/leads", "POST", payload, ""),
    request("/leads", "POST", payload, ""),
  ]);
  for (const response of responses) assert.equal(response.status, 201);
  const results = await Promise.all(
    responses.map((response) => response.json()),
  );
  assert.equal(results[0].id, results[1].id);
  assert.equal(results[0].requestCode, results[0].id);
  assert.equal(results[0].email, "preview");
  const lead = await db.lead.findUniqueOrThrow({ where: { submissionKey } });
  assert.equal(await db.lead.count({ where: { submissionKey } }), 1);
  const emails = await db.leadEmail.findMany({ where: { leadId: lead.id } });
  assert.equal(emails.length, 1);
  for (const email of emails) {
    assert.equal(email.status, "PREVIEW");
    assert.equal(email.sentAt, null);
    assert.equal(email.attempts, 1);
    assert.ok(email.messageId);
    assert.ok(!email.html.includes("<script>"));
    assert.ok(!email.html.includes("<img src=x"));
  }
  const owner = emails.find((email) => email.kind === "OWNER_NOTICE")!;
  assert.ok(!emails.some((email) => email.kind === "CUSTOMER_RECEIPT"));
  assert.equal(owner.recipient, "owner@example.com");
  assert.equal(owner.replyTo, lead.email);
  assert.ok(owner.subject.includes(results[0].requestCode));
  assert.ok(owner.text.includes(`Mã yêu cầu: ${results[0].requestCode}`));
  assert.ok(owner.text.includes("/#/leads?id="));
  assert.equal(
    (await request(`/admin/leads/${lead.id}/emails`, "GET", undefined, ""))
      .status,
    401,
  );
  const historyResponse = await request(`/admin/leads/${lead.id}/emails`);
  assert.equal(historyResponse.status, 200);
  const history = await historyResponse.json();
  assert.equal(history.mode, "preview");
  assert.equal(history.items.length, 1);
  assert.equal(
    (
      await request(
        `/admin/leads/${lead.id}/emails/${owner.id}/retry`,
        "POST",
        {},
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        "/leads",
        "POST",
        { ...payload, message: "Changed request with the same key" },
        "",
      )
    ).status,
    409,
  );
  assert.ok(
    !JSON.stringify(await (await request("/content")).json()).includes(
      "mail-preview@example.com",
    ),
  );
});

test("email configuration failure preserves consultation and outbox for later retry", async () => {
  const { env } = await import("../src/config/env");
  const previousMode = env.mailMode;
  env.mailMode = "smtp";
  try {
    const response = await request(
      "/leads",
      "POST",
      {
        submissionKey: crypto.randomUUID(),
        fullName: "SMTP pending",
        organization: "Sandbox Company",
        email: "pending-mail@example.com",
        interests: [],
      },
      "",
    );
    assert.equal(response.status, 201);
    const result = await response.json();
    assert.equal(result.stored, true);
    assert.equal(result.email, "pending");
    assert.ok(await db.lead.findUnique({ where: { id: result.id } }));
    const emails = await db.leadEmail.findMany({
      where: { leadId: result.id },
    });
    assert.equal(emails.length, 1);
    assert.ok(
      emails.every(
        (email) => email.status === "FAILED" && email.error?.includes("SMTP"),
      ),
    );
  } finally {
    env.mailMode = previousMode;
  }
});

test("SMTP retries use a database lease and never resend completed or captured mail", async () => {
  const { deliverEmail, notificationDrafts, mailConfiguration } = await import(
    "../src/services/mail.service"
  );
  const config = {
    ...mailConfiguration(),
    mode: "smtp" as const,
    error: null,
    sender: "sender@example.com",
    owner: "owner@example.com",
    replyTo: "owner@example.com",
    host: "smtp.example.com",
    user: "sender@example.com",
    password: "test-secret-only",
  };
  const lead = await db.lead.create({
    data: {
      fullName: "Retry fixture",
      organization: "Sandbox",
      email: "retry@example.com",
      interests: [],
    },
  });
  const email = await db.leadEmail.create({
    data: notificationDrafts(lead, config)[0],
  });
  await deliverEmail(email.id, {
    db,
    config,
    sender: {
      async sendMail() {
        throw Object.assign(
          new Error("test-secret-only exposed SMTP response"),
          { code: "EAUTH" },
        );
      },
    },
  });
  const failed = await db.leadEmail.findUniqueOrThrow({
    where: { id: email.id },
  });
  assert.equal(failed.status, "FAILED");
  assert.ok(!failed.error?.includes("test-secret-only"));
  let sends = 0;
  const sender = {
    async sendMail() {
      sends++;
      await new Promise((resolve) => setTimeout(resolve, 30));
      return {
        messageId: "stable-message-id",
        accepted: ["owner@example.com"],
      };
    },
  };
  await Promise.all([
    deliverEmail(email.id, { db, config, sender }),
    deliverEmail(email.id, { db, config, sender }),
  ]);
  const sent = await db.leadEmail.findUniqueOrThrow({
    where: { id: email.id },
  });
  assert.equal(sent.status, "SENT");
  assert.equal(sent.attempts, 2);
  assert.equal(sends, 1);
  assert.ok(sent.sentAt);
  await deliverEmail(email.id, { db, config, sender });
  assert.equal(sends, 1);
  const legacyReceipt = await db.leadEmail.create({
    data: {
      ...notificationDrafts(lead, config)[0],
      kind: "CUSTOMER_RECEIPT",
      recipient: lead.email,
    },
  });
  await deliverEmail(legacyReceipt.id, { db, config, sender });
  assert.equal(sends, 1, "Old customer receipts must never be sent");
  assert.equal((await request(`/admin/leads/${lead.id}/emails/${legacyReceipt.id}/retry`, "POST", {})).status, 409);
  const captured = await db.leadEmail.findFirstOrThrow({
    where: { status: "PREVIEW" },
  });
  await deliverEmail(captured.id, { db, config, sender });
  assert.equal(sends, 1);
  const rejected = await db.leadEmail.create({
    data: { ...notificationDrafts(lead, config)[0], leadId: (await db.lead.create({
      data: { fullName: "Rejected fixture", organization: "Test", email: "rejected@example.com", interests: [] },
    })).id },
  });
  await deliverEmail(rejected.id, {
    db,
    config,
    sender: {
      async sendMail() {
        return { accepted: [] };
      },
    },
  });
  assert.equal(
    (await db.leadEmail.findUniqueOrThrow({ where: { id: rejected.id } }))
      .status,
    "FAILED",
  );
});

test("consultation throttling rejects repeated submissions but allows idempotent retry", async () => {
  const email = "mail-quota@example.com";
  let lastPayload: Record<string, unknown> = {};
  for (let i = 0; i < 3; i++) {
    lastPayload = {
      submissionKey: crypto.randomUUID(),
      fullName: "Quota test",
      organization: "Sandbox",
      email,
      interests: [],
    };
    assert.equal(
      (await request("/leads", "POST", lastPayload, "")).status,
      201,
    );
  }
  assert.equal((await request("/leads", "POST", lastPayload, "")).status, 201);
  assert.equal(
    (
      await request(
        "/leads",
        "POST",
        { ...lastPayload, submissionKey: crypto.randomUUID() },
        "",
      )
    ).status,
    429,
  );
  assert.equal(await db.lead.count({ where: { email } }), 3);
});

test("create, update, publish and delete work for every content collection", async () => {
  for (const collection of [
    "laws",
    "courses",
    "tiers",
    "programs",
    "media",
    "events",
    "lessons",
    "quiz",
  ] as const) {
    const current = await workspace();
    const rows = current.workspace.data[collection];
    const definition = schemaFor(collection, current.workspace.data);
    const key = definition.titleKey,
      order = definition.orderKey!;
    const row = {
      ...rows[0],
      id: `crud-${collection}`,
      [key]: `CRUD ${collection}`,
      [order]: Math.max(...rows.map((item) => Number(item[order]))) + 1,
    };
    if (collection === "courses") row.code = "QA-CRUD";
    if (collection === "events") row.slug = "qa-crud-event";
    const created = await save(collection, row);
    assert.ok(
      created.workspace.data[collection].some((item) => item.id === row.id),
    );
    const updated = await save(collection, {
      ...row,
      [key]: `Updated CRUD ${collection}`,
    });
    assert.equal(
      updated.workspace.data[collection].find((item) => item.id === row.id)?.[
        key
      ],
      `Updated CRUD ${collection}`,
    );
    await publish();
    const content = (await (await request("/content")).json()) as SiteContent;
    const publicRows =
      collection === "programs"
        ? content.tiers.flatMap((tier) => tier.programs)
        : content[collection];
    assert.ok(
      JSON.stringify(publicRows).includes(`Updated CRUD ${collection}`),
    );
    const deleted = await request(
      `/admin/records/${collection}/${row.id}`,
      "DELETE",
      { revision: (await workspace()).revision },
    );
    assert.equal(deleted.status, 200, await deleted.clone().text());
    assert.ok(
      !(await workspace()).workspace.data[collection].some(
        (item) => item.id === row.id,
      ),
    );
    // Deleting a draft does not remove it from the public page until published.
    assert.ok(
      JSON.stringify(await (await request("/content")).json()).includes(
        `Updated CRUD ${collection}`,
      ),
    );
    await publish();
    assert.ok(
      !JSON.stringify(await (await request("/content")).json()).includes(
        `Updated CRUD ${collection}`,
      ),
    );
  }
  const current = await workspace();
  for (const [collection, id] of [
    [
      "courses",
      current.workspace.data.courses.find((row) => row.code === "B6")!.id,
    ],
    ["tiers", current.workspace.data.programs[0].tierId],
  ] as const) {
    const response = await request(
      `/admin/records/${collection}/${id}`,
      "DELETE",
      { revision: current.revision },
    );
    assert.equal(response.status, 400);
    assert.equal((await workspace()).revision, current.revision);
  }
});

test("filtered reorder stays within its group and rejects a record from another group", async () => {
  for (const collection of ["programs", "media"] as const) {
    const current = await workspace(),
      key = schemaFor(collection, current.workspace.data).filter!.key;
    const rows = current.workspace.data[collection],
      value = String(rows[0][key]);
    const group = rows.filter((row) => String(row[key]) === value);
    assert.ok(group.length > 1);
    const other = rows.filter((row) => String(row[key]) !== value);
    const response = await request(`/admin/reorder/${collection}`, "POST", {
      id: group[0].id,
      direction: 1,
      filter: value,
      revision: current.revision,
    });
    assert.equal(response.status, 200, await response.clone().text());
    const changed = (await workspace()).workspace.data[collection];
    assert.equal(
      changed.filter((row) => String(row[key]) === value)[0].id,
      group[1].id,
    );
    for (const row of other)
      assert.equal(
        changed.find((item) => item.id === row.id)?.sortOrder,
        row.sortOrder,
      );
    const latest = await workspace();
    const mismatch = await request(`/admin/reorder/${collection}`, "POST", {
      id: other[0].id,
      direction: 1,
      filter: value,
      revision: latest.revision,
    });
    assert.equal(mismatch.status, 400);
    assert.equal((await workspace()).revision, latest.revision);
  }
});

test("changing a member name preserves sessions; security changes and expiry revoke access", async () => {
  const member = (await workspace()).workspace.data.members.find(
    (row) => row.id === "integration-editor",
  )!;
  let editorCookie = (await signIn(String(member.email), password)).headers
    .get("set-cookie")!
    .split(";")[0];
  await save("members", { ...member, name: "Renamed editor" });
  assert.equal((await workspace(editorCookie)).user.name, "Renamed editor");
  await save("members", { ...member, role: "advisor" });
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, editorCookie)).status,
    401,
  );
  editorCookie = (await signIn(String(member.email), password)).headers
    .get("set-cookie")!
    .split(";")[0];
  await save("members", { ...member, email: "renamed-editor@example.com" });
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, editorCookie)).status,
    401,
  );
  editorCookie = (await signIn("renamed-editor@example.com", password)).headers
    .get("set-cookie")!
    .split(";")[0];
  const nextPassword = randomBytes(24).toString("hex");
  await save("members", {
    ...member,
    email: "renamed-editor@example.com",
    password: nextPassword,
  });
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, editorCookie)).status,
    401,
  );
  editorCookie = (
    await signIn("renamed-editor@example.com", nextPassword)
  ).headers
    .get("set-cookie")!
    .split(";")[0];
  await db.adminSession.updateMany({
    where: { userId: member.id },
    data: { expiresAt: new Date(Date.now() - 1000) },
  });
  assert.equal(
    (await request("/admin/bootstrap", "GET", undefined, editorCookie)).status,
    401,
  );
});

test("public content endpoints agree with publication and private endpoints require authentication", async () => {
  const content = (await (await request("/content")).json()) as SiteContent;
  for (const key of ["laws", "courses", "tiers", "media", "events"] as const)
    assert.deepEqual(await (await request(`/${key}`)).json(), content[key]);
  assert.deepEqual(await (await request("/elearning")).json(), {
    lessons: content.lessons,
    quiz: content.quiz,
  });
  for (const group of ["M1", "M2", "M3"])
    assert.deepEqual(
      await (await request(`/media?group=${group}`)).json(),
      content.media.filter((row) => row.group === group),
    );
  for (const status of ["up", "web", "past"])
    assert.deepEqual(
      await (await request(`/events?status=${status}`)).json(),
      content.events.filter((row) => row.status === status),
    );
  assert.deepEqual(
    await (await request("/sectors")).json(),
    content.tiers.flatMap((tier) =>
      tier.programs.map((program) => ({
        name: program.name,
        tier: tier.shortLabel,
      })),
    ),
  );
  for (const [route, method] of [
    ["/admin/publish", "POST"],
    ["/admin/records/courses/private-test", "PUT"],
    ["/admin/records/courses/private-test", "DELETE"],
    ["/admin/reorder/courses", "POST"],
    ["/admin/quiz-preview", "POST"],
  ] as const)
    assert.equal((await request(route, method, {}, "")).status, 401);
  // The legacy token API is disabled when ADMIN_TOKEN is unset.
  assert.equal((await request("/leads", "GET", undefined, "")).status, 503);
});

test(
  "Nodemailer delivers only the owner notification through a loopback SMTP receiver",
  { timeout: 10000 },
  async () => {
    const connections = new Set<Socket>();
    const messages: { recipient: string; source: string }[] = [];
    const smtp = createSmtpServer((socket) => {
      connections.add(socket);
      socket.on("close", () => connections.delete(socket));
      let buffer = "",
        receiving = false,
        source = "",
        recipient = "";
      socket.write("220 localhost test SMTP\r\n");
      socket.on("data", (data) => {
        buffer += data.toString();
        while (buffer.includes("\r\n")) {
          const end = buffer.indexOf("\r\n"),
            line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (receiving) {
            if (line === ".") {
              messages.push({ recipient, source });
              receiving = false;
              socket.write("250 Message accepted\r\n");
            } else source += line.replace(/^\.\./, ".") + "\r\n";
          } else if (/^EHLO|^HELO/.test(line))
            socket.write("250 localhost\r\n");
          else if (/^RCPT TO:/i.test(line)) {
            recipient = line.match(/<([^>]+)>/)![1];
            socket.write("250 Recipient accepted\r\n");
          } else if (line === "DATA") {
            receiving = true;
            source = "";
            socket.write("354 End with dot\r\n");
          } else if (line === "QUIT") socket.end("221 Bye\r\n");
          else socket.write("250 OK\r\n");
        }
      });
    });
    smtp.listen(0, "127.0.0.1");
    await once(smtp, "listening");
    const address = smtp.address();
    assert.ok(address && typeof address !== "string");
    const nodemailer = requireFromTest(
      "nodemailer",
    ) as typeof import("nodemailer");
    // Plain SMTP is allowed only in this injected test transport, never in production configuration.
    const sender = nodemailer.createTransport({
      host: "127.0.0.1",
      port: address.port,
      secure: false,
      ignoreTLS: true,
      connectionTimeout: 1500,
      socketTimeout: 1500,
    });
    try {
      const { deliverEmail, notificationDrafts, mailConfiguration } =
        await import("../src/services/mail.service");
      const config = {
        ...mailConfiguration(),
        mode: "smtp" as const,
        error: null,
      };
      const lead = await db.lead.create({
        data: {
          fullName: "SMTP wire fixture",
          organization: "Sandbox",
          email: "wire-customer@example.com",
          interests: [],
        },
      });
      const emails = await Promise.all(
        notificationDrafts(lead, config).map((data) =>
          db.leadEmail.create({ data }),
        ),
      );
      for (const email of emails) {
        await deliverEmail(email.id, { db, config, sender });
        const sent = await db.leadEmail.findUniqueOrThrow({
          where: { id: email.id },
        });
        assert.equal(sent.status, "SENT");
        assert.ok(sent.sentAt);
        assert.equal(sent.attempts, 1);
        const received = messages.find(
          (message) => message.recipient === email.recipient,
        );
        assert.ok(received);
        assert.ok(received.source.includes(`Reply-To: ${email.replyTo}`));
        assert.ok(received.source.includes("Message-ID:"));
        assert.ok(received.source.includes("multipart/alternative"));
      }
      assert.equal(messages.length, 1);
      assert.equal(messages[0].recipient, config.owner);
      assert.ok(!messages.some(message => message.recipient === lead.email));
    } finally {
      sender.close();
      for (const socket of connections) socket.destroy();
      await new Promise<void>((resolve) => smtp.close(() => resolve()));
    }
  },
);

test("demo login and form inspection link require explicit sandbox opt-in", async () => {
  const { env } = await import("../src/config/env");
  const { hashPassword } = await import("../src/services/auth.service");
  const { DEMO_ADMIN_EMAIL } = await import("../../shared/admin-access");
  await db.adminUser.create({ data: {
    email: DEMO_ADMIN_EMAIL, name: "Admin demo", role: "ADMIN",
    passwordHash: await hashPassword("admin"),
  } });
  const previousMode = env.demoAdminLogin;
  try {
    env.demoAdminLogin = false;
    assert.equal((await (await request("/admin/login-info", "GET", undefined, "")).json()).demoLogin, false);
    for (const email of ["admin", DEMO_ADMIN_EMAIL])
      assert.equal((await request("/admin/login", "POST", { email, password: "admin" }, "")).status, 401);
    env.demoAdminLogin = true;
    assert.equal((await (await request("/admin/login-info", "GET", undefined, "")).json()).demoLogin, true);
    assert.equal((await request("/admin/login", "POST", { email: "admin", password: "wrong" }, "")).status, 401);
    const signedIn = await signIn("admin", "admin");
    const demoCookie = signedIn.headers.get("set-cookie")!.split(";")[0];
    assert.equal((await signedIn.json()).user.role, "admin");
    const form = await request("/leads", "POST", {
      fullName: "Demo inspection", organization: "Sandbox", email: "demo-inspection@example.com",
    }, "");
    assert.equal(form.status, 201);
    const result = await form.json();
    assert.equal(result.adminUrl, `${env.adminAppUrl}/#/leads?id=${result.id}`);
    env.demoAdminLogin = false;
    assert.equal((await request("/admin/bootstrap", "GET", undefined, demoCookie)).status, 401);
    const regularForm = await request("/leads", "POST", {
      fullName: "Normal inspection", organization: "Sandbox", email: "normal-inspection@example.com",
    }, "");
    assert.equal((await regularForm.json()).adminUrl, undefined);
  } finally {
    env.demoAdminLogin = previousMode;
  }
});

test("consultation notifications enforce roles and include a newly submitted form", async () => {
  assert.equal((await request("/admin/notifications", "GET", undefined, "")).status, 401);
  const { hashPassword } = await import("../src/services/auth.service");
  await db.adminUser.create({ data: {
    email: "notification-editor@example.com", name: "Editor", role: "EDITOR",
    passwordHash: await hashPassword(password),
  } });
  const editor = await signIn("notification-editor@example.com", password);
  const editorCookie = editor.headers.get("set-cookie")!.split(";")[0];
  assert.equal((await request("/admin/notifications", "GET", undefined, editorCookie)).status, 403);
  const form = await request("/leads", "POST", {
    fullName: "New notification", organization: "Sandbox notification", email: "new-notification@example.com",
  }, "");
  const lead = await form.json();
  const response = await request("/admin/notifications");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.ok(result.newCount > 0);
  assert.ok(result.latest.length <= 5);
  assert.ok(result.latest.some((item: { id: string }) => item.id === lead.id));
  assert.ok(!JSON.stringify(result).includes("new-notification@example.com"));
  assert.match(response.headers.get("cache-control")!, /no-store/);
});

test("Prisma config loads with the patched deepmerge dependency", async () => {
  const directory = await mkdtemp(
    path.join(os.tmpdir(), "iaris-prisma-config-"),
  );
  const configFile = path.join(directory, "prisma.config.js");
  try {
    await writeFile(
      configFile,
      'module.exports = { schema: "schema.prisma" };\n',
    );
    const { loadConfigFromFile } = requireFromTest(
      "@prisma/config",
    ) as typeof import("@prisma/config");
    const loaded = await loadConfigFromFile({ configRoot: directory });
    assert.ok(!loaded.error, JSON.stringify(loaded.error));
    assert.equal(loaded.resolvedPath, configFile);
    assert.equal(loaded.config?.schema, path.join(directory, "schema.prisma"));
  } finally {
    await unlink(configFile);
    await rmdir(directory);
  }
});

test("ordering remains unique and data survives a new database connection", async () => {
  const current = await workspace();
  const first = current.workspace.data.lessons[0];
  const response = await request("/admin/reorder/lessons", "POST", {
    id: first.id,
    direction: 1,
    revision: current.revision,
  });
  assert.equal(response.status, 200);
  const positions = (await workspace()).workspace.data.lessons.map((r) =>
    Number(r.position),
  );
  assert.equal(new Set(positions).size, positions.length);
  const { PrismaClient } = await import("@prisma/client");
  const connection = new PrismaClient();
  try {
    assert.equal(
      (
        await connection.course.findFirstOrThrow({
          orderBy: { sortOrder: "asc" },
        })
      ).title,
      "Updated through admin API",
    );
    assert.ok((await connection.auditLog.count()) >= 10);
  } finally {
    await connection.$disconnect();
  }
  assert.equal((await request("/admin/logout", "POST", {})).status, 200);
  assert.equal((await request("/admin/bootstrap")).status, 401);
});

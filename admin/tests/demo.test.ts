import assert from "node:assert/strict";
import test from "node:test";
import { createDemoWorkspace } from "../../shared/admin-demo";
import { staticContent } from "../../shared/content";
import {
  newRecord,
  matchesSearch,
  schemaFor,
  validateFields,
  validateRecord,
} from "../src/schema";

test("Vietnamese search ignores accents and case, including uppercase Đ", () => {
  assert.equal(
    matchesSearch({ id: "demo", fullName: "Đặng Phương Thảo" }, "dang phuong"),
    true,
  );
  assert.equal(
    matchesSearch({ id: "demo", fullName: "Đỗ Minh Anh" }, "DO MINH"),
    true,
  );
  assert.equal(
    matchesSearch({ id: "demo", fullName: "Nguyễn Minh Anh" }, "khong co"),
    false,
  );
});

test("admin fixtures cannot mutate website content or another demo session", () => {
  const first = createDemoWorkspace();
  const original = staticContent.media[0].benefits[0];
  (first.data.media[0].benefits as string[])[0] = "Changed only in demo";
  (first.data.quiz[0].options as string[]).push("A new answer");
  assert.equal(staticContent.media[0].benefits[0], original);
  assert.equal(createDemoWorkspace().data.media[0].benefits[0], original);
  assert.equal(staticContent.quiz[0].options.length, 3);
});

test("each fixture collection has stable unique IDs and valid relationships", () => {
  const { data } = createDemoWorkspace();
  for (const rows of Object.values(data))
    assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  for (const row of data.programs)
    assert.ok(data.tiers.some((t) => t.id === row.tierId));
  for (const row of [...data.lessons, ...data.quiz])
    assert.ok(data.courses.some((c) => c.code === row.courseCode));
  for (const lead of data.leads)
    assert.match(String(lead.email), /@example\.com$/);
});

test("course codes and event slugs must remain unique", () => {
  const { data } = createDemoWorkspace();
  assert.ok(
    validateRecord("courses", { ...data.courses[1], code: "b1" }, data),
  );
  assert.equal(validateRecord("courses", data.courses[1], data), null);
  assert.ok(
    validateRecord("events", { ...data.events[0], slug: "không hợp lệ" }, data),
  );
  assert.ok(
    validateRecord(
      "events",
      { ...data.events[1], slug: data.events[0].slug },
      data,
    ),
  );
});

test("quiz edits cannot leave the correct answer outside the answer list", () => {
  const { data } = createDemoWorkspace();
  const row = { ...data.quiz[0], options: ["Một", "Hai"], correctIndex: 2 };
  assert.ok(validateRecord("quiz", row, data));
  assert.equal(validateRecord("quiz", { ...row, correctIndex: 1 }, data), null);
  assert.ok(
    validateRecord("quiz", { ...row, options: ["Một"], correctIndex: 0 }, data),
  );
});

test("required fields reject whitespace and numeric fields enforce valid ranges", () => {
  const { data } = createDemoWorkspace();
  const schema = schemaFor("tiers", data);
  assert.ok(validateFields(schema.fields, { ...data.tiers[0], label: "   " }));
  assert.ok(validateFields(schema.fields, { ...data.tiers[0], depth: 4 }));
  assert.ok(validateFields(schema.fields, { ...data.tiers[0], depth: 1.5 }));
  assert.equal(validateFields(schema.fields, data.tiers[0]), null);
});

test("new programs bind to an existing tier and reject orphan relationships", () => {
  const { data } = createDemoWorkspace();
  const row = newRecord("programs", data);
  assert.equal(row.tierId, data.tiers[0].id);
  assert.ok(
    validateRecord("programs", { ...row, tierId: "missing-tier" }, data),
  );
});

test("new lesson order follows existing lessons and duplicate positions are rejected", () => {
  const { data } = createDemoWorkspace();
  const row = newRecord("lessons", data);
  assert.equal(row.position, 7);
  assert.equal(row.courseCode, "B6");
  assert.ok(validateRecord("lessons", { ...row, position: 1 }, data));
});

test("account editor validates email and password length", () => {
  const { data } = createDemoWorkspace();
  assert.ok(
    validateRecord(
      "members",
      { ...data.members[0], email: "invalid-address" },
      data,
    ),
  );
  assert.equal(validateRecord("members", data.members[0], data), null);
  assert.equal(
    validateRecord(
      "members",
      { ...data.members[0], email: "admin@company.vn" },
      data,
    ),
    null,
  );
  assert.ok(
    validateRecord("members", { ...data.members[0], password: "short" }, data),
  );
});

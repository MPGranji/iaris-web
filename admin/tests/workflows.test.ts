import assert from "node:assert/strict";
import { after, afterEach, before, beforeEach, test } from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";
import { act, createElement } from "react";
import type { Root } from "react-dom/client";
import { createServer, type ViteDevServer } from "vite";
import { createDemoWorkspace, type Collection } from "../../shared/admin-demo";
import { defaultSections } from "../../shared/site-settings";
import { staticContent } from "../../shared/content";

// React DOM tests: no browser automation, external mail, or production database.
let dom: JSDOM, server: ViteDevServer, root: Root;
let App: (props: object) => unknown,
  Contact: (props: object) => unknown,
  Elearning: (props: object) => unknown;
let createRoot: (typeof import("react-dom/client"))["createRoot"];
let workspace = createDemoWorkspace();
let authenticated = false,
  role = "admin",
  revision = 0,
  failNextWrite = false;
let failLeadResponse = false;
let failQuizResponse = false;
let demoMode = true;
let exportedBlob: Blob | null = null;
const calls: { path: string; method: string; body: any }[] = [];
const originalFetch = globalThis.fetch;
const originalGlobals = new Map<string, PropertyDescriptor | undefined>();
const originalCreateUrl = URL.createObjectURL,
  originalRevokeUrl = URL.revokeObjectURL;
const pause = () => new Promise((resolve) => setTimeout(resolve, 0));
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
function snapshot() {
  const copy = structuredClone(workspace);
  if (role === "editor") {
    copy.data.leads = [];
    copy.data.members = [];
  }
  if (role === "advisor")
    for (const key of Object.keys(copy.data))
      if (key !== "leads") copy.data[key as Collection] = [];
  return {
    user: {
      id: "current-user",
      name: "Nguyễn Minh An",
      email: `${role}@example.com`,
      role,
    },
    workspace: copy,
    revision,
    websiteUrl: "https://website.example.com",
  };
}
async function fakeFetch(input: string | URL | Request, init?: RequestInit) {
  const route = String(input),
    method = init?.method ?? "GET";
  const body = init?.body ? JSON.parse(String(init.body)) : {};
  calls.push({ path: route, method, body });
  if (route === "/api/quiz-attempts") {
    if (failQuizResponse) {
      failQuizResponse = false;
      return json({ error: "Chưa lưu được kết quả. Vui lòng thử lại." }, 503);
    }
    return json({ score: 1, total: 1, stored: true }, 201);
  }
  if (route === "/api/leads") {
    if (failLeadResponse) {
      failLeadResponse = false;
      return json({ error: "Mạng bị gián đoạn. Vui lòng thử lại." }, 503);
    }
    return json({ stored: true, id: "lead-from-form", email: "preview",
      ...(demoMode ? { adminUrl: "https://admin.example.com/#/leads?id=lead-from-form" } : {}),
    }, 201);
  }
  if (route === "/api/admin/login-info") return json({ demoLogin: demoMode });
  if (route === "/api/admin/login") {
    if (body.password !== "correct-password" && !(demoMode && body.email === "admin" && body.password === "admin"))
      return json({ error: "Tài khoản hoặc mật khẩu chưa đúng." }, 401);
    authenticated = true;
    role = body.email.split("@")[0];
    return json(snapshot());
  }
  if (!authenticated) return json({ error: "Vui lòng đăng nhập." }, 401);
  if (route === "/api/admin/logout") {
    authenticated = false;
    return json({ ok: true });
  }
  if (route === "/api/admin/bootstrap") return json(snapshot());
  if (route === "/api/admin/notifications") {
    if (role === "editor") return json({ error: "Không có quyền truy cập" }, 403);
    const rows = workspace.data.leads.filter(lead => lead.status === "NEW")
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    return json({ newCount: rows.length, latest: rows.slice(0, 5) });
  }
  if (route.endsWith("/emails"))
    return json({
      mode: "preview",
      configured: true,
      configurationError: null,
      items: [],
    });
  if (failNextWrite) {
    failNextWrite = false;
    return json({ error: "Không lưu được dữ liệu. Thử lại." }, 503);
  }
  if (route.startsWith("/api/admin/records/")) {
    const [, collection, id] = route.match(/records\/([^/]+)\/(.+)$/)!;
    const rows = workspace.data[collection as Collection];
    if (method === "DELETE")
      workspace.data[collection as Collection] = rows.filter(
        (row) => row.id !== id,
      );
    else {
      const index = rows.findIndex((row) => row.id === id);
      if (index < 0) rows.push(body.row);
      else rows[index] = body.row;
    }
    revision++;
    return json(snapshot());
  }
  if (route === "/api/admin/publish") {
    workspace.publishedData = structuredClone(workspace.data);
    workspace.publishedData.leads = [];
    workspace.publishedData.members = [];
    workspace.publications.unshift({
      id: crypto.randomUUID(),
      label: body.label,
      createdAt: new Date().toISOString(),
      recordCount: 60,
    });
    revision++;
    return json(snapshot());
  }
  if (route.startsWith("/api/admin/reorder/")) return json(snapshot());
  throw new Error(`Unhandled test request: ${method} ${route}`);
}
function element<T extends Element>(selector: string): T {
  const match = document.querySelector<T>(selector);
  assert.ok(match, selector);
  return match;
}
function named(tag: string, text: string): HTMLElement {
  const match = [...document.querySelectorAll<HTMLElement>(tag)].find(
    (node) => node.textContent?.trim() === text,
  );
  assert.ok(match, `${tag}: ${text}`);
  return match;
}
function control(labelText: string) {
  const label = [...document.querySelectorAll("label")].find((node) =>
    node.textContent?.trim().startsWith(labelText),
  );
  assert.ok(label?.htmlFor, labelText);
  return `[id="${label.htmlFor}"]`;
}
async function waitFor(check: () => boolean) {
  for (let index = 0; index < 100; index++) {
    if (check()) return;
    await act(async () => {
      await pause();
    });
  }
  assert.ok(check(), document.body.textContent?.slice(0, 700));
}
async function click(node: HTMLElement) {
  await act(async () => {
    node.click();
    await pause();
  });
}
async function fill(selector: string, value: string) {
  const input = element<HTMLInputElement>(selector);
  await act(async () => {
    const prototype =
      input.tagName === "TEXTAREA"
        ? dom.window.HTMLTextAreaElement.prototype
        : input.tagName === "SELECT"
          ? dom.window.HTMLSelectElement.prototype
          : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, "value")!.set!.call(
      input,
      value,
    );
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
    input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}
async function submit(form: HTMLFormElement) {
  await act(async () => {
    form.dispatchEvent(
      new dom.window.Event("submit", { bubbles: true, cancelable: true }),
    );
    await pause();
  });
}
async function login(userRole = "admin") {
  await act(async () => {
    root.render(createElement(App as any));
    await pause();
  });
  await waitFor(
    () =>
      !element<HTMLButtonElement>('button[type="submit"], .welcome-button')
        .disabled,
  );
  await fill('input[name="username"]', `${userRole}@example.com`);
  await fill('input[type="password"]', "correct-password");
  await submit(element("form"));
  await waitFor(() => Boolean(document.querySelector(".sidebar")));
}
before(async () => {
  dom = new JSDOM(
    '<!doctype html><html><body><div id="root"></div></body></html>',
    { url: "http://127.0.0.1:5176/", pretendToBeVisual: true },
  );
  for (const key of [
    "window",
    "document",
    "navigator",
    "HTMLElement",
    "HTMLDialogElement",
    "HTMLInputElement",
    "HTMLTextAreaElement",
    "HTMLSelectElement",
    "Element",
    "Node",
    "Event",
    "MouseEvent",
    "KeyboardEvent",
    "FormData",
    "history",
    "location",
  ]) {
    originalGlobals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value: (dom.window as any)[key],
    });
  }
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  dom.window.scrollTo = () => {};
  dom.window.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  dom.window.HTMLDialogElement.prototype.close = function () {
    this.open = false;
  };
  URL.createObjectURL = (blob) => {
    exportedBlob = blob as Blob;
    return "blob:test-download";
  };
  URL.revokeObjectURL = () => {};
  const anchorClick = dom.window.HTMLAnchorElement.prototype.click;
  dom.window.HTMLAnchorElement.prototype.click = function () {
    if (!this.download) anchorClick.call(this);
  };
  ({ createRoot } = await import("react-dom/client"));
  server = await createServer({
    root: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.."),
    configFile: false,
    server: { middlewareMode: true },
    appType: "custom",
  });
  App = (await server.ssrLoadModule("/admin/src/App.tsx")).App;
  Contact = (await server.ssrLoadModule("/frontend/src/sections/Contact.tsx"))
    .Contact;
  Elearning = (
    await server.ssrLoadModule("/frontend/src/sections/Elearning.tsx")
  ).Elearning;
});
beforeEach(() => {
  workspace = createDemoWorkspace();
  workspace.data.website = structuredClone(defaultSections);
  authenticated = false;
  role = "admin";
  revision = 0;
  failNextWrite = false;
  failLeadResponse = false;
  failQuizResponse = false;
  demoMode = true;
  calls.length = 0;
  exportedBlob = null;
  history.replaceState(null, "", "/");
  globalThis.fetch = fakeFetch as typeof fetch;
  root = createRoot(element("#root"));
});
afterEach(async () => {
  await act(async () => {
    root.unmount();
    await pause();
  });
  document.getElementById("root")!.replaceChildren();
});
after(async () => {
  await server?.close();
  dom?.window.close();
  globalThis.fetch = originalFetch;
  URL.createObjectURL = originalCreateUrl;
  URL.revokeObjectURL = originalRevokeUrl;
  for (const [key, descriptor] of originalGlobals)
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete (globalThis as any)[key];
  delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
});

test("admin login validates credentials and every navigation item opens a page", async () => {
  await act(async () => {
    root.render(createElement(App as any));
    await pause();
  });
  await waitFor(() => !element<HTMLButtonElement>(".welcome-button").disabled);
  await fill('input[name="username"]', "admin@example.com");
  await fill("input[type=password]", "incorrect");
  await submit(element("form"));
  assert.ok(
    document.body.textContent?.includes("Tài khoản hoặc mật khẩu chưa đúng."),
  );
  await fill("input[type=password]", "correct-password");
  await submit(element("form"));
  await waitFor(() => Boolean(document.querySelector(".main-nav")));
  for (const href of [
    ...document.querySelectorAll<HTMLAnchorElement>(".main-nav a"),
  ].map((anchor) => anchor.getAttribute("href")!)) {
    await click(element(`.main-nav a[href="${href}"]`));
    await waitFor(() => window.location.hash === href);
    assert.ok(document.querySelector("main h1"), href);
    assert.ok(
      !document
        .querySelector("main")!
        .textContent!.includes("Trang này không tồn tại"),
      href,
    );
  }
  await click(named("button", "Đăng xuất"));
  await waitFor(() => Boolean(document.querySelector(".welcome-card")));
});

test("demo credentials are displayed and admin/admin opens the workspace", async () => {
  await act(async () => { root.render(createElement(App as any)); await pause(); });
  await waitFor(() => Boolean(document.querySelector(".demo-login-hint")));
  assert.ok(element(".demo-login-hint").textContent?.includes("Tài khoản: admin"));
  assert.ok(element(".demo-login-hint").textContent?.includes("Mật khẩu: admin"));
  await fill('input[name="username"]', "admin");
  await fill('input[type="password"]', "admin");
  await submit(element("form"));
  await waitFor(() => Boolean(document.querySelector(".sidebar")));
});

test("new consultation notification preserves an unsaved editor and opens the new record on confirmation", async () => {
  await login();
  await waitFor(() => calls.some(call => call.path === "/api/admin/notifications"));
  await click(named("a", "Khóa nền tảng"));
  await click(element('button[title="Chỉnh sửa"]'));
  await fill(control("Tên chương trình"), "Bản đang sửa dở");
  const lead = { ...workspace.data.leads[0], id: "new-notification", fullName: "Khách vừa gửi form",
    status: "NEW", createdAt: new Date(Date.now() + 60000).toISOString() };
  workspace.data.leads.push(lead);
  await act(async () => { window.dispatchEvent(new dom.window.Event("focus")); await pause(); });
  await waitFor(() => Boolean(document.querySelector(".toast")?.textContent?.includes("Khách vừa gửi form")));
  assert.equal(element<HTMLInputElement>(control("Tên chương trình")).value, "Bản đang sửa dở");
  await click(element(".notification-trigger"));
  await click(element(".notification-list button"));
  await click(named("dialog button", "Hủy"));
  assert.equal(element<HTMLInputElement>(control("Tên chương trình")).value, "Bản đang sửa dở");
  await click(element(".notification-list button"));
  await click(named("dialog button", "Mở yêu cầu"));
  await waitFor(() => window.location.hash.includes("new-notification"));
  await waitFor(() => Boolean(document.querySelector("main")?.textContent?.includes("Khách vừa gửi form")));
});

test("editor sees content tasks and no consultation shortcut or private records", async () => {
  await login("editor");
  assert.ok(!document.querySelector('.main-nav a[href="#/leads"]'));
  assert.ok(!document.querySelector(".notification-trigger"));
  assert.ok(!document.body.textContent?.includes("Hộp thư đang trống"));
  await click(element('button[aria-label="Tìm nhanh trong admin"]'));
  assert.ok(
    ![...document.querySelectorAll(".command-shortcuts button")].some(
      (button) => button.textContent?.includes("Yêu cầu tư vấn"),
    ),
  );
});

test("failed content save retains form and unsaved guard; successful retry updates the list", async () => {
  await login();
  await click(named("a", "Khóa nền tảng"));
  await click(element('button[title="Chỉnh sửa"]'));
  await fill(control("Tên chương trình"), "Khóa học đã chỉnh");
  failNextWrite = true;
  await submit(element("form.editor-layout"));
  await waitFor(() => Boolean(document.querySelector(".inline-error")));
  assert.equal(
    element<HTMLInputElement>(control("Tên chương trình")).value,
    "Khóa học đã chỉnh",
  );
  assert.ok(
    document
      .querySelector(".inline-error")
      ?.textContent?.includes("Không lưu được"),
  );
  await click(named("a", "Đạo luật"));
  await waitFor(() => Boolean(document.querySelector("dialog[open]")));
  await click(named("dialog button", "Hủy"));
  assert.ok(document.querySelector("form.editor-layout"));
  await submit(element("form.editor-layout"));
  await waitFor(() => !document.querySelector("form.editor-layout"));
  assert.ok(document.body.textContent?.includes("Khóa học đã chỉnh"));
});

test("content search, pagination and filtered ordering keep the selected group", async () => {
  await login();
  await click(named("a", "IARIS Media"));
  await fill('select[aria-label="Số bản ghi mỗi trang"]', "5");
  assert.equal(document.querySelectorAll("tbody tr").length, 5);
  await click(element('button[aria-label="Trang sau"]'));
  assert.ok(
    document.querySelector(".pagination")?.textContent?.includes("6–10"),
  );
  await fill("input[type=search]", "không-có-kết-quả");
  assert.ok(document.body.textContent?.includes("Không có kết quả phù hợp"));
  await fill("input[type=search]", "");
  await click(named("a", "Chương trình ngành"));
  const tierId = workspace.data.tiers[1].id;
  await fill('select[aria-label="Tất cả nhóm ngành"]', tierId);
  assert.equal(
    element<HTMLButtonElement>('tbody button[title="Di chuyển lên"]').disabled,
    true,
  );
  await click(element('tbody button[title="Di chuyển xuống"]'));
  const call = calls.findLast(
    (item) => item.path === "/api/admin/reorder/programs",
  );
  assert.equal(call?.body.filter, tierId);
});

test("publication updates only after confirmation and JSON export excludes private data", async () => {
  await login();
  await click(named("a", "Xuất bản"));
  await click(named("button", "Tải nội dung JSON"));
  assert.ok(exportedBlob);
  const exported = JSON.parse(await (exportedBlob as Blob).text());
  assert.ok(exported.content.courses.length);
  assert.ok(
    !JSON.stringify(exported).includes(workspace.data.leads[0].email as string),
  );
  assert.ok(!("workspace" in exported));
  await submit(element("section.publication-form form"));
  assert.ok(!calls.some((call) => call.path === "/api/admin/publish"));
  await click(named("dialog button", "Xuất bản"));
  await waitFor(() => workspace.publications.length === 1);
  assert.ok(document.body.textContent?.includes("Đã xuất bản."));
});

test("advisor can filter leads, save internal notes and open the configured website form", async () => {
  await login("advisor");
  assert.ok(!document.querySelector('.main-nav a[href="#/courses"]'));
  assert.equal(
    element<HTMLAnchorElement>('a[target="_blank"]').href,
    "https://website.example.com/#contact",
  );
  await fill("input[type=search]", workspace.data.leads[0].fullName as string);
  assert.equal(document.querySelectorAll("tbody tr").length, 1);
  await click(element("tbody button.table-record-link"));
  await fill("textarea", "Ghi chú riêng của tư vấn viên");
  await submit(element(".lead-actions form"));
  await waitFor(() => calls.some((call) => call.method === "PUT"));
  assert.equal(
    calls.findLast((call) => call.method === "PUT")?.body.row.note,
    "Ghi chú riêng của tư vấn viên",
  );
  assert.ok(document.body.textContent?.includes("Email liên quan"));
});

test("public consultation keeps fields and the same submission key after a failed response", async () => {
  await act(async () => {
    root.render(createElement(Contact as any, { tiers: [], prefill: null }));
  });
  await fill("#f-name", "Khách thử nghiệm");
  await fill("#f-org", "Doanh nghiệp thử");
  await fill("#f-email", "customer@example.com");
  failLeadResponse = true;
  await submit(element("form"));
  assert.ok(!document.querySelector(".form-admin-link"));
  assert.equal(element<HTMLInputElement>("#f-name").value, "Khách thử nghiệm");
  const firstKey = calls.findLast((call) => call.path === "/api/leads")?.body
    .submissionKey;
  await submit(element("form"));
  const secondKey = calls.findLast((call) => call.path === "/api/leads")?.body
    .submissionKey;
  assert.equal(firstKey, secondKey);
  assert.ok(firstKey);
  assert.equal(element<HTMLInputElement>("#f-name").value, "");
  assert.ok(document.body.textContent?.includes("Đội ngũ phụ trách sẽ liên hệ"));
  assert.equal(element<HTMLAnchorElement>(".form-admin-link").href,
    "https://admin.example.com/#/leads?id=lead-from-form");
});

test("public quiz reports persistence failure and uses server result after retry", async () => {
  await act(async () => {
    root.render(
      createElement(Elearning as any, {
        lessons: staticContent.lessons.slice(0, 1),
        quiz: staticContent.quiz.slice(0, 1),
        persist: true,
      }),
    );
  });
  assert.equal(element("#progTxt").textContent, "0/1 bài");
  await click(element("#markDone"));
  assert.equal(element("#progTxt").textContent, "1/1 bài");
  await click(element(".answers button"));
  failQuizResponse = true;
  await click(element("#qNext"));
  assert.ok(element("[role=alert]").textContent?.includes("Chưa lưu được"));
  assert.ok(!document.querySelector("#qAgain"));
  await click(element("#qNext"));
  assert.ok(element("#qBox").textContent?.includes("1/1 tình huống đúng"));
  assert.ok(!document.querySelector("[role=alert]"));
  await click(element("#qAgain"));
  assert.equal(element("#qNext").getAttribute("hidden"), "");
});

test("empty lessons and quiz have safe empty states", async () => {
  await act(async () => {
    root.render(
      createElement(Elearning as any, { lessons: [], quiz: [], persist: true }),
    );
  });
  assert.equal(element("#progTxt").textContent, "0/0 bài");
  assert.equal(element<HTMLButtonElement>("#markDone").disabled, true);
  assert.ok(element("#qBox").textContent?.includes("Chưa có câu hỏi"));
  assert.ok(!document.body.innerHTML.includes("NaN"));
});

test("network failure leaves admin on login with a readable error and permits retry", async () => {
  await act(async () => {
    root.render(createElement(App as any));
    await pause();
  });
  await waitFor(() => !element<HTMLButtonElement>(".welcome-button").disabled);
  await fill('input[name="username"]', "admin@example.com");
  await fill("input[type=password]", "correct-password");
  globalThis.fetch = async () => {
    throw new TypeError("Failed to fetch");
  };
  await submit(element("form"));
  assert.ok(document.body.textContent?.includes("Không kết nối được máy chủ"));
  globalThis.fetch = fakeFetch as typeof fetch;
  await submit(element("form"));
  await waitFor(() => Boolean(document.querySelector(".sidebar")));
});

import assert from "node:assert/strict";
import { once } from "node:events";
import { after, before, test } from "node:test";
import express from "express";
import { adminDemoRouter } from "../src/routes/admin-demo";
import type { DemoWorkspace } from "../../shared/admin-demo";

const app = express();
app.use("/api/admin-demo", adminDemoRouter);
const server = app.listen(0, "127.0.0.1");
let base = "";
before(async () => {
  if (!server.listening) await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  base = `http://127.0.0.1:${address.port}/api/admin-demo`;
});
after(
  () =>
    new Promise<void>((resolve, reject) =>
      server.close((err) => (err ? reject(err) : resolve())),
    ),
);

test("bootstrap provides isolated demo fixtures without a database or admin credentials", async () => {
  const response = await fetch(`${base}/bootstrap`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  const body = (await response.json()) as {
    mode: string;
    workspace: DemoWorkspace;
  };
  assert.equal(body.mode, "demo");
  assert.equal(body.workspace.data.courses.length, 6);
  assert.equal(body.workspace.data.leads.length, 12);
  assert.deepEqual(body.workspace.attempts, []);
  assert.deepEqual(body.workspace.publications, []);
  assert.equal(body.workspace.publishedData, null);
});

test("the demo API exposes no write endpoint", async () => {
  for (const method of ["POST", "PATCH", "DELETE"]) {
    const response = await fetch(`${base}/bootstrap`, { method });
    assert.equal(response.status, 404);
  }
});

import { Router } from "express";
import { createDemoWorkspace } from "../../../shared/admin-demo";

/** Read-only fixture API. Intentionally independent of Prisma and the real admin endpoints. */
export const adminDemoRouter = Router();

adminDemoRouter.get("/bootstrap", (_req, res) => {
  res
    .set("Cache-Control", "no-store")
    .json({ mode: "demo", workspace: createDemoWorkspace() });
});

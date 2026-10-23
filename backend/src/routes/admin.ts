import { Router } from "express";
import { z } from "zod";
import { COLLECTIONS } from "../../../shared/admin-demo";
import { schemaFor } from "../../../shared/admin-schema";
import {
  authenticated,
  currentUser,
  database,
  login,
  logout,
  sameOrigin,
} from "../services/auth.service";
import {
  changeWorkspace,
  deleteRecord,
  loadWorkspace,
  mutationInput,
  publish,
  saveRecord,
} from "../services/admin.service";
import { HttpError } from "../lib/http-error";
import { mailHistory, retryEmail } from "../services/mail.service";
import { env } from "../config/env";

export const adminRouter = Router();
adminRouter.use((_req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});
adminRouter.use(sameOrigin);
adminRouter.get("/login-info", (_req, res) => {
  res.json({ demoLogin: env.demoAdminLogin });
});
adminRouter.post("/login", async (req, res) => {
  const values = z
    .object({
      email: z.string().trim().toLowerCase().max(200).pipe(
        z.union([z.literal("admin"), z.string().email()]),
      ),
      password: z.string().min(1).max(128),
    })
    .parse(req.body);
  const user = await login(req, res, values.email, values.password);
  res.json({
    user,
    ...(await database().$transaction((db) => loadWorkspace(db, user), {
      isolationLevel: "RepeatableRead",
    })),
  });
});
adminRouter.use(authenticated);
const requireLeadAccess = (role: string) => {
  if (role === "editor")
    throw new HttpError(403, "Không có quyền truy cập hồ sơ tư vấn.");
};
adminRouter.get("/notifications", async (_req, res) => {
  requireLeadAccess(currentUser(res).role);
  const [newCount, latest] = await database().$transaction([
    database().lead.count({ where: { status: "NEW" } }),
    database().lead.findMany({
      where: { status: "NEW" },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5,
      select: { id: true, fullName: true, organization: true, createdAt: true },
    }),
  ]);
  res.json({ newCount, latest });
});
adminRouter.get("/leads/:id/emails", async (req, res) => {
  requireLeadAccess(currentUser(res).role);
  res.json(await mailHistory(req.params.id));
});
adminRouter.post("/leads/:id/emails/:emailId/retry", async (req, res) => {
  const user = currentUser(res);
  requireLeadAccess(user.role);
  res.json(await retryEmail(req.params.id, req.params.emailId, user.id));
});
adminRouter.post("/logout", async (req, res) => {
  await logout(req, res);
  res.json({ ok: true });
});
adminRouter.get("/bootstrap", async (_req, res) => {
  const user = currentUser(res);
  res.json({
    user,
    ...(await database().$transaction((db) => loadWorkspace(db, user), {
      isolationLevel: "RepeatableRead",
    })),
  });
});
adminRouter.put("/records/:collection/:id", async (req, res) => {
  const collection = z.enum(COLLECTIONS).parse(req.params.collection);
  const input = mutationInput.parse(req.body);
  const user = currentUser(res);
  res.json(
    await changeWorkspace(
      user,
      input.revision,
      collection,
      req.params.id,
      "save",
      (db, data) =>
        saveRecord(db, collection, req.params.id, input.row, data, user),
    ),
  );
});
adminRouter.delete("/records/:collection/:id", async (req, res) => {
  const collection = z.enum(COLLECTIONS).parse(req.params.collection);
  const revision = z.number().int().nonnegative().parse(req.body.revision);
  res.json(
    await changeWorkspace(
      currentUser(res),
      revision,
      collection,
      req.params.id,
      "delete",
      (db, data) => deleteRecord(db, collection, req.params.id, data),
    ),
  );
});
adminRouter.post("/reorder/:collection", async (req, res) => {
  const collection = z
    .enum([
      "laws",
      "courses",
      "tiers",
      "programs",
      "media",
      "events",
      "lessons",
      "quiz",
    ])
    .parse(req.params.collection);
  const input = z
    .object({
      id: z.string(),
      direction: z.union([z.literal(-1), z.literal(1)]),
      filter: z.string().max(120).optional(),
      revision: z.number().int().nonnegative(),
    })
    .parse(req.body);
  res.json(
    await changeWorkspace(
      currentUser(res),
      input.revision,
      collection,
      input.id,
      "reorder",
      async (db, data) => {
        const schema = schemaFor(collection, data);
        const key = schema.orderKey!;
        const rows = [...data[collection]]
          .filter(
            (row) =>
              !input.filter ||
              !schema.filter ||
              String(row[schema.filter.key]) === input.filter,
          )
          .sort((a, b) => Number(a[key]) - Number(b[key]));
        const from = rows.findIndex((r) => r.id === input.id),
          to = from + input.direction;
        if (from < 0 || to < 0 || to >= rows.length)
          throw new HttpError(400, "Không thể di chuyển bản ghi.");
        [rows[from], rows[to]] = [rows[to], rows[from]];
        // Temporary negative positions avoid unique collisions inside this transaction.
        const update = async (id: string, value: number) => {
          switch (collection) {
            case "tiers":
              await db.sectorTier.update({
                where: { id },
                data: { level: value },
              });
              break;
            case "lessons":
              await db.lesson.update({
                where: { id },
                data: { position: value },
              });
              break;
            case "quiz":
              await db.quizQuestion.update({
                where: { id },
                data: { position: value },
              });
              break;
            case "laws":
              await db.law.update({
                where: { id },
                data: { sortOrder: value },
              });
              break;
            case "courses":
              await db.course.update({
                where: { id },
                data: { sortOrder: value },
              });
              break;
            case "programs":
              await db.sectorProgram.update({
                where: { id },
                data: { sortOrder: value },
              });
              break;
            case "media":
              await db.mediaService.update({
                where: { id },
                data: { sortOrder: value },
              });
              break;
            case "events":
              await db.event.update({
                where: { id },
                data: { sortOrder: value },
              });
              break;
          }
        };
        for (const [index, row] of rows.entries())
          await update(row.id, -index - 1);
        for (const [index, row] of rows.entries())
          await update(row.id, index + 1);
      },
    ),
  );
});
adminRouter.post("/publish", async (req, res) => {
  const input = z
    .object({
      label: z.string().trim().min(1).max(120),
      revision: z.number().int().nonnegative(),
    })
    .parse(req.body);
  const user = currentUser(res);
  res.json(
    await changeWorkspace(
      user,
      input.revision,
      "publishing",
      "main",
      "publish",
      (db, data) => publish(db, data, user, input.label),
    ),
  );
});
adminRouter.post("/quiz-preview", async (req, res) => {
  if (currentUser(res).role === "advisor")
    throw new HttpError(403, "Không có quyền thử nội dung quiz.");
  const answers = z
    .array(z.number().int().min(0).max(7))
    .max(1000)
    .parse(req.body.answers);
  const result = await database().$transaction(
    async (db) => {
      const course = await db.course.findUniqueOrThrow({
        where: { code: "B6" },
      });
      const questions = await db.quizQuestion.findMany({
        where: { courseId: course.id },
        orderBy: { position: "asc" },
      });
      if (
        !questions.length ||
        answers.length !== questions.length ||
        answers.some((answer, i) => answer >= questions[i].options.length)
      )
        throw new HttpError(400, "Đáp án không khớp bộ câu hỏi.");
      const score = questions.filter(
        (q, i) => q.correctIndex === answers[i],
      ).length;
      await db.quizAttempt.create({
        data: {
          courseId: course.id,
          answers,
          score,
          total: questions.length,
          questions: JSON.parse(JSON.stringify(questions)),
        },
      });
      return { score, total: questions.length };
    },
    { isolationLevel: "RepeatableRead" },
  );
  res.status(201).json(result);
});

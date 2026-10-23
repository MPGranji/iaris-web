import { AdminRole, EventKind, EventStatus, Prisma } from "@prisma/client";
import { z } from "zod";
import {
  COLLECTIONS,
  type Collection,
  type DemoData,
  type DemoRecord,
  type DemoWorkspace,
} from "../../../shared/admin-demo";
import { canEdit, type AdminIdentity } from "../../../shared/admin-access";
import {
  schemaFor,
  validateFields,
  validateRecord,
} from "../../../shared/admin-schema";
import { INTEREST_OPTIONS, type SiteContent } from "../../../shared/types";
import { HttpError } from "../lib/http-error";
import { database, hashPassword } from "./auth.service";
import { toSiteContent } from "../../../shared/site-settings";
import { env } from "../config/env";

type Db = Prisma.TransactionClient;
const status = {
  up: EventStatus.UPCOMING,
  web: EventStatus.WEBINAR,
  past: EventStatus.PAST,
};
const kind = {
  ev: EventKind.EVENT,
  com: EventKind.COMPETITION,
  web: EventKind.WEBINAR,
  past: EventKind.PAST,
};
const mapRecord = (row: object): DemoRecord =>
  Object.fromEntries(
    Object.entries(row).flatMap(([key, value]) =>
      value === null ||
      (typeof value === "object" &&
        !(value instanceof Date) &&
        !Array.isArray(value))
        ? []
        : [[key, value instanceof Date ? value.toISOString() : value]],
    ),
  ) as DemoRecord;
const publicOnly = (data: DemoData): DemoData => ({
  ...data,
  leads: [],
  members: [],
});

export async function loadWorkspace(
  db: Db,
  user: AdminIdentity,
): Promise<{ workspace: DemoWorkspace; revision: number; websiteUrl: string }> {
  const [
    sections,
    laws,
    courses,
    tiers,
    programs,
    media,
    events,
    lessons,
    quiz,
    leads,
    members,
    attempts,
    publications,
    state,
  ] = await Promise.all([
    db.siteSection.findMany({ orderBy: { id: "asc" } }),
    db.law.findMany({ orderBy: { sortOrder: "asc" } }),
    db.course.findMany({ orderBy: { sortOrder: "asc" } }),
    db.sectorTier.findMany({ orderBy: { level: "asc" } }),
    db.sectorProgram.findMany({ orderBy: { sortOrder: "asc" } }),
    db.mediaService.findMany({ orderBy: { sortOrder: "asc" } }),
    db.event.findMany({ orderBy: { sortOrder: "asc" } }),
    db.lesson.findMany({
      where: { course: { code: "B6" } },
      include: { course: { select: { code: true } } },
      orderBy: { position: "asc" },
    }),
    db.quizQuestion.findMany({
      where: { course: { code: "B6" } },
      include: { course: { select: { code: true } } },
      orderBy: { position: "asc" },
    }),
    user.role !== "editor"
      ? db.lead.findMany({
          include: { event: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          take: 500,
        })
      : [],
    user.role === "admin"
      ? db.adminUser.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            active: true,
            createdAt: true,
          },
        })
      : [],
    user.role !== "advisor"
      ? db.quizAttempt.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
      : [],
    user.role !== "advisor"
      ? db.publication.findMany({ orderBy: { revision: "desc" }, take: 30 })
      : [],
    db.contentState.findUniqueOrThrow({ where: { id: "main" } }),
  ]);
  const data: DemoData = {
    website: sections.map(
      (s) => ({ ...(s.fields as object), id: s.id }) as DemoRecord,
    ),
    laws: laws.map((l) => ({
      ...mapRecord(l),
      effectiveDate: l.effectiveDate.toISOString().slice(0, 10),
    })),
    courses: courses.map(mapRecord),
    tiers: tiers.map(mapRecord),
    programs: programs.map(mapRecord),
    media: media.map(mapRecord),
    events: events.map((e) => ({
      ...mapRecord(e),
      status: Object.keys(status).find(
        (k) => status[k as keyof typeof status] === e.status,
      )!,
      kind: Object.keys(kind).find(
        (k) => kind[k as keyof typeof kind] === e.kind,
      )!,
      startsAt: e.startsAt?.toISOString().slice(0, 10) ?? "",
    })),
    lessons: lessons.map((l) => ({
      ...mapRecord(l),
      courseCode: l.course.code,
    })),
    quiz: quiz.map((q) => ({ ...mapRecord(q), courseCode: q.course.code })),
    leads: leads.map((l) => ({
      ...mapRecord(l),
      note: l.note ?? "",
      eventTitle: l.event?.title ?? "",
      interests: l.interests.map(
        (code) => INTEREST_OPTIONS.find((o) => o.code === code)?.label ?? code,
      ),
    })),
    members: members.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role.toLowerCase(),
      status: m.active ? "active" : "inactive",
    })),
  };
  if (user.role === "advisor")
    for (const key of COLLECTIONS) if (key !== "leads") data[key] = [];
  return {
    revision: state.revision,
    websiteUrl: /^https?:\/\//.test(env.publicSiteUrl)
      ? env.publicSiteUrl
      : "http://127.0.0.1:5175",
    workspace: {
      version: 1,
      data,
      changedAt: state.updatedAt.toISOString(),
      attempts: attempts.map((a) => ({
        id: a.id,
        createdAt: a.createdAt.toISOString(),
        correct: a.score,
        total: a.total,
      })),
      publications: publications.map((p) => ({
        id: p.id,
        createdAt: p.createdAt.toISOString(),
        label: p.label,
        recordCount: p.recordCount,
      })),
      publishedData: publications[0]
        ? (publications[0].editorData as unknown as DemoData)
        : null,
    },
  };
}

const rowInput = z.record(
  z.union([
    z.string().max(12000),
    z.number().finite(),
    z.boolean(),
    z.array(z.string().max(12000)).max(100),
  ]),
);
export const mutationInput = z.object({
  revision: z.number().int().nonnegative(),
  row: rowInput,
});
export async function changeWorkspace(
  user: AdminIdentity,
  revision: number,
  collection: Collection | "publishing",
  recordId: string,
  action: string,
  mutate: (db: Db, data: DemoData) => Promise<void>,
) {
  if (
    collection === "publishing"
      ? user.role === "advisor"
      : !canEdit(user.role, collection)
  )
    throw new HttpError(
      403,
      "Vai trò của bạn không có quyền thực hiện thao tác này.",
    );
  return database().$transaction(
    async (db) => {
      const changed = await db.contentState.updateMany({
        where: { id: "main", revision },
        data: { revision: { increment: 1 } },
      });
      if (changed.count !== 1)
        throw new HttpError(
          409,
          "Dữ liệu đã thay đổi ở phiên khác. Tải lại dữ liệu trước khi lưu tiếp.",
        );
      const { workspace } = await loadWorkspace(db, { ...user, role: "admin" });
      await mutate(db, workspace.data);
      await db.auditLog.create({
        data: { actorId: user.id, action, collection, recordId },
      });
      return { user, ...(await loadWorkspace(db, user)) };
    },
    { timeout: 20000 },
  );
}

export async function saveRecord(
  db: Db,
  collection: Collection,
  id: string,
  input: Record<string, unknown>,
  data: DemoData,
  user: AdminIdentity,
) {
  z.string().min(1).max(120).parse(id);
  const existing = data[collection].find((r) => r.id === id);
  if (collection === "leads") {
    const values = z
      .object({
        status: z.enum([
          "NEW",
          "CONTACTED",
          "QUALIFIED",
          "WON",
          "LOST",
          "SPAM",
        ]),
        note: z.string().trim().max(2000),
      })
      .parse(input);
    if (!existing)
      throw new HttpError(400, "Tạo yêu cầu qua form tư vấn trên website.");
    await db.lead.update({ where: { id }, data: values });
    return;
  }
  if (collection === "members") {
    const values = z
      .object({
        name: z.string().trim().min(1).max(120),
        email: z.string().trim().toLowerCase().email().max(200),
        role: z.enum(["admin", "editor", "advisor"]),
        status: z.enum(["active", "inactive"]),
        password: z.string().min(12).max(128).optional(),
      })
      .parse({ ...input, password: input.password || undefined });
    if (!existing && !values.password)
      throw new HttpError(400, "Tài khoản mới cần mật khẩu ít nhất 12 ký tự.");
    if (
      id === user.id &&
      (values.role !== "admin" || values.status !== "active")
    )
      throw new HttpError(
        400,
        "Không thể tự khóa hoặc hạ quyền tài khoản đang đăng nhập.",
      );
    const { password, role, status: memberStatus, ...fields } = values;
    const record = {
      ...fields,
      role: role.toUpperCase() as AdminRole,
      active: memberStatus === "active",
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
    };
    if (existing) {
      await db.adminUser.update({ where: { id }, data: record });
      if (
        password ||
        existing.role !== role ||
        existing.status !== memberStatus ||
        existing.email !== values.email
      ) {
        await db.adminSession.deleteMany({ where: { userId: id } });
      }
    } else
      await db.adminUser.create({
        data: { ...record, id, passwordHash: record.passwordHash! },
      });
    return;
  }
  if (collection === "website") {
    if (!existing) throw new HttpError(400, "Khối website không tồn tại.");
    const fields = Object.fromEntries(
      Object.keys(existing)
        .filter((k) => k !== "id")
        .map((k) => [
          k,
          z
            .string()
            .trim()
            .max(12000)
            .parse(input[k] ?? ""),
        ]),
    );
    if (!String(fields.title).trim() || !String(fields.subtitle).trim())
      throw new HttpError(400, "Tiêu đề và mô tả không được trống.");
    if (fields.email) z.string().email().parse(fields.email);
    await db.siteSection.update({ where: { id }, data: { fields } });
    return;
  }
  const schema = schemaFor(collection, data);
  const row = { id } as DemoRecord;
  for (const field of schema.fields) {
    const value = input[field.key];
    row[field.key] =
      field.type === "checkbox"
        ? z.boolean().parse(value)
        : field.type === "number" || field.key === "correctIndex"
          ? z.number().int().parse(value)
          : field.type === "lines"
            ? z.array(z.string().trim().min(1).max(12000)).max(100).parse(value)
            : z
                .string()
                .trim()
                .max(12000)
                .parse(value ?? "");
  }
  const error =
    validateFields(schema.fields, row) ?? validateRecord(collection, row, data);
  if (error) throw new HttpError(400, error);
  if (collection === "courses" && existing?.code === "B6" && row.code !== "B6")
    throw new HttpError(400, "B6 là mã cố định của e-learning.");
  const s = (key: string) => String(row[key]);
  const n = (key: string) => Number(row[key]);
  switch (collection) {
    case "laws": {
      const date = new Date(s("effectiveDate"));
      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(s("effectiveDate")) ||
        Number.isNaN(date.getTime()) ||
        date.toISOString().slice(0, 10) !== row.effectiveDate
      )
        throw new HttpError(400, "Ngày hiệu lực không hợp lệ.");
      const record = {
        name: s("name"),
        detail: s("detail"),
        sortOrder: n("sortOrder"),
        effectiveDate: date,
      };
      await db.law.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "courses": {
      const record = {
        code: s("code"),
        title: s("title"),
        tagline: s("tagline"),
        duration: s("duration"),
        audience: s("audience"),
        outcomes: s("outcomes"),
        sortOrder: n("sortOrder"),
      };
      await db.course.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "tiers": {
      const record = {
        level: n("level"),
        depth: n("depth"),
        label: s("label"),
        shortLabel: s("shortLabel"),
        introLead: s("introLead"),
        introBody: s("introBody"),
      };
      await db.sectorTier.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "programs": {
      const record = {
        name: s("name"),
        tierId: s("tierId"),
        audience: s("audience"),
        focus: s("focus"),
        standards: s("standards"),
        launchPeriod: s("launchPeriod"),
        sortOrder: n("sortOrder"),
      };
      await db.sectorProgram.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "media": {
      const record = {
        group: z.enum(["M1", "M2", "M3"]).parse(row.group),
        name: s("name"),
        tagline: s("tagline"),
        benefits: row.benefits as string[],
        meta: s("meta"),
        featured: Boolean(row.featured),
        sortOrder: n("sortOrder"),
      };
      await db.mediaService.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "events": {
      const startsAt = row.startsAt ? new Date(s("startsAt")) : null;
      if (
        startsAt &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(s("startsAt")) ||
          Number.isNaN(startsAt.getTime()) ||
          startsAt.toISOString().slice(0, 10) !== row.startsAt)
      )
        throw new HttpError(400, "Ngày bắt đầu không hợp lệ.");
      const record = {
        slug: s("slug"),
        title: s("title"),
        summary: s("summary"),
        status: status[s("status") as keyof typeof status],
        kind: kind[s("kind") as keyof typeof kind],
        dateLabel: s("dateLabel"),
        periodLabel: s("periodLabel"),
        startsAt,
        tags: row.tags as string[],
        ctaLabel: s("ctaLabel"),
        sortOrder: n("sortOrder"),
      };
      await db.event.upsert({
        where: { id },
        create: { id, ...record },
        update: record,
      });
      break;
    }
    case "lessons":
    case "quiz": {
      const course = await db.course.findUniqueOrThrow({
        where: { code: "B6" },
      });
      if (collection === "lessons") {
        const record = {
          courseId: course.id,
          title: s("title"),
          summary: s("summary"),
          durationMin: n("durationMin"),
          position: n("position"),
        };
        await db.lesson.upsert({
          where: { id },
          create: { id, ...record },
          update: record,
        });
      } else {
        const record = {
          courseId: course.id,
          scenario: s("scenario"),
          message: s("message"),
          options: row.options as string[],
          correctIndex: n("correctIndex"),
          explanation: s("explanation"),
          position: n("position"),
        };
        await db.quizQuestion.upsert({
          where: { id },
          create: { id, ...record },
          update: record,
        });
      }
      break;
    }
  }
}

export async function deleteRecord(
  db: Db,
  collection: Collection,
  id: string,
  data: DemoData,
) {
  const row = data[collection].find((r) => r.id === id);
  if (!row) throw new HttpError(404, "Bản ghi không còn tồn tại.");
  switch (collection) {
    case "website":
    case "members":
    case "leads":
      throw new HttpError(
        400,
        "Không hỗ trợ xóa ở mục này. Khóa tài khoản hoặc đánh dấu spam khi cần.",
      );
    case "courses":
      if (
        row.code === "B6" ||
        (await db.quizAttempt.count({ where: { courseId: id } })) ||
        (await db.lesson.count({ where: { courseId: id } })) ||
        (await db.quizQuestion.count({ where: { courseId: id } }))
      )
        throw new HttpError(400, "Khóa đang liên kết dữ liệu học tập.");
      await db.course.delete({ where: { id } });
      break;
    case "tiers":
      if (data.programs.some((p) => p.tierId === id))
        throw new HttpError(
          400,
          "Chuyển chương trình sang nhóm khác trước khi xóa.",
        );
      await db.sectorTier.delete({ where: { id } });
      break;
    case "laws":
      await db.law.delete({ where: { id } });
      break;
    case "programs":
      await db.sectorProgram.delete({ where: { id } });
      break;
    case "media":
      await db.mediaService.delete({ where: { id } });
      break;
    case "events":
      await db.event.delete({ where: { id } });
      break;
    case "lessons":
      await db.lesson.delete({ where: { id } });
      break;
    case "quiz":
      await db.quizQuestion.delete({ where: { id } });
      break;
  }
}

export async function publish(
  db: Db,
  data: DemoData,
  user: AdminIdentity,
  label: string,
) {
  const state = await db.contentState.findUniqueOrThrow({
    where: { id: "main" },
  });
  const editorData = publicOnly(data);
  const content: SiteContent = toSiteContent(editorData);
  await db.publication.create({
    data: {
      label,
      revision: state.revision,
      actorId: user.id,
      content: content as unknown as Prisma.InputJsonValue,
      editorData: editorData as unknown as Prisma.InputJsonValue,
      recordCount: Object.values(editorData).reduce(
        (n, rows) => n + rows.length,
        0,
      ),
    },
  });
}

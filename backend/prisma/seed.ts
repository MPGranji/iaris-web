// Seeds/refreshes all *content* tables from shared/content.ts.
// Leads and quiz attempts (user data) are never touched.
//   npm run db:seed
import { PrismaClient, EventKind, EventStatus } from "@prisma/client";
import { staticContent, ELEARNING_COURSE_CODE } from "../../shared/content";
import type { EventKindCode, EventStatusCode } from "../../shared/types";
import { defaultSections } from "../../shared/site-settings";
import { hashPassword, identity } from "../src/services/auth.service";
import { loadWorkspace, publish } from "../src/services/admin.service";
import { DEMO_ADMIN_EMAIL } from "../../shared/admin-access";

const prisma = new PrismaClient();

const STATUS: Record<EventStatusCode, EventStatus> = {
  up: EventStatus.UPCOMING,
  web: EventStatus.WEBINAR,
  past: EventStatus.PAST,
};
const KIND: Record<EventKindCode, EventKind> = {
  ev: EventKind.EVENT,
  com: EventKind.COMPETITION,
  web: EventKind.WEBINAR,
  past: EventKind.PAST,
};

async function main() {
  const c = staticContent;

  if ((await prisma.course.count()) === 0)
    await prisma.$transaction(
      async (tx) => {
        // Laws: no natural key → replace all
        await tx.law.deleteMany();
        await tx.law.createMany({
          data: c.laws.map((l, i) => ({
            ...l,
            effectiveDate: new Date(l.effectiveDate),
            sortOrder: i + 1,
          })),
        });

        // Courses (upsert by code so lessons/quiz attempts keep their FK)
        for (const [i, course] of c.courses.entries()) {
          await tx.course.upsert({
            where: { code: course.code },
            create: { ...course, sortOrder: i + 1 },
            update: { ...course, sortOrder: i + 1 },
          });
        }

        // Tiers + programs (upsert so Lead.sectorProgramId stays valid)
        for (const tier of c.tiers) {
          const { programs, ...tierData } = tier;
          const t = await tx.sectorTier.upsert({
            where: { level: tier.level },
            create: tierData,
            update: tierData,
          });
          for (const [i, p] of programs.entries()) {
            await tx.sectorProgram.upsert({
              where: { name: p.name },
              create: { ...p, tierId: t.id, sortOrder: i + 1 },
              update: { ...p, tierId: t.id, sortOrder: i + 1 },
            });
          }
        }

        // Media: no natural key → replace all
        await tx.mediaService.deleteMany();
        await tx.mediaService.createMany({
          data: c.media.map((m, i) => ({ ...m, sortOrder: i + 1 })),
        });

        // Events (upsert by slug so Lead.eventId stays valid)
        for (const [i, e] of c.events.entries()) {
          const data = {
            ...e,
            status: STATUS[e.status],
            kind: KIND[e.kind],
            sortOrder: i + 1,
          };
          await tx.event.upsert({
            where: { slug: e.slug },
            create: data,
            update: data,
          });
        }

        // Lessons + quiz of the e-learning course
        const b6 = await tx.course.findUniqueOrThrow({
          where: { code: ELEARNING_COURSE_CODE },
        });
        await tx.lesson.deleteMany({ where: { courseId: b6.id } });
        await tx.lesson.createMany({
          data: c.lessons.map((l) => ({ ...l, courseId: b6.id })),
        });
        await tx.quizQuestion.deleteMany({ where: { courseId: b6.id } });
        await tx.quizQuestion.createMany({
          data: c.quiz.map((q) => ({ ...q, courseId: b6.id })),
        });
      },
      { timeout: 60_000 },
    );

  for (const { id, ...fields } of defaultSections)
    await prisma.siteSection.upsert({
      where: { id },
      create: { id, fields },
      update: {},
    });
  await prisma.contentState.upsert({
    where: { id: "main" },
    create: { id: "main" },
    update: {},
  });
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;
  if (
    email &&
    password &&
    !(await prisma.adminUser.findUnique({ where: { email } }))
  ) {
    if (password.length < 12)
      throw new Error("Bootstrap password must have at least 12 characters");
    await prisma.adminUser.create({
      data: {
        email,
        name: "Quản trị IARIS",
        role: "ADMIN",
        passwordHash: await hashPassword(password),
      },
    });
  }
  if (process.env.DEMO_ADMIN_LOGIN === "true")
    await prisma.adminUser.upsert({
      where: { email: DEMO_ADMIN_EMAIL },
      create: {
        email: DEMO_ADMIN_EMAIL,
        name: "Admin demo",
        role: "ADMIN",
        passwordHash: await hashPassword("admin"),
      },
      update: {},
    });
  const admin = await prisma.adminUser.findFirst({
    where: { role: "ADMIN", active: true },
  });
  if (admin && (await prisma.publication.count()) === 0)
    await prisma.$transaction(async (tx) => {
      const user = identity(admin);
      const { workspace } = await loadWorkspace(tx, user);
      await publish(tx, workspace.data, user, "Nội dung ban đầu");
    });

  const counts = {
    laws: await prisma.law.count(),
    courses: await prisma.course.count(),
    programs: await prisma.sectorProgram.count(),
    media: await prisma.mediaService.count(),
    events: await prisma.event.count(),
  };
  console.log("Seed done:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

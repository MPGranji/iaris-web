import { Prisma, type Interest, type LeadStatus } from "@prisma/client";
import { createHash } from "node:crypto";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { HttpError } from "../lib/http-error";
import type { LeadResult } from "../../../shared/types";
import type { LeadInputParsed } from "../validators/lead.schema";
import {
  ownerEmailStatus,
  deliverLeadEmails,
  notificationDrafts,
} from "./mail.service";

export async function createLead(
  input: LeadInputParsed,
  userAgent?: string,
): Promise<LeadResult> {
  if (!prisma) return { id: null, stored: false };

  const [sectorProgram, event] = await Promise.all([
    input.sector
      ? prisma.sectorProgram.findUnique({
          where: { name: input.sector },
          select: { id: true },
        })
      : null,
    input.eventSlug
      ? prisma.event.findUnique({
          where: { slug: input.eventSlug },
          select: { id: true },
        })
      : null,
  ]);

  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        ...input,
        submissionKey: undefined,
        interests: [...input.interests].sort(),
      }),
    )
    .digest("hex");
  async function existingSubmission() {
    if (!input.submissionKey || !prisma) return null;
    const existing = await prisma.lead.findUnique({
      where: { submissionKey: input.submissionKey },
    });
    if (existing && existing.submissionHash !== fingerprint)
      throw new HttpError(
        409,
        "Mã gửi đã dùng cho nội dung khác. Vui lòng tải lại biểu mẫu.",
      );
    return existing;
  }
  let lead = await existingSubmission();
  if (!lead)
    try {
      lead = await prisma.$transaction(async (tx) => {
        // Serialize submissions to the same email to limit duplicate owner notifications in parallel.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.email}))`;
        if (input.submissionKey) {
          const duplicate = await tx.lead.findUnique({
            where: { submissionKey: input.submissionKey },
          });
          if (duplicate) {
            if (duplicate.submissionHash !== fingerprint)
              throw new HttpError(409, "Mã gửi đã dùng cho nội dung khác.");
            return duplicate;
          }
        }
        const recentCount = await tx.lead.count({
          where: {
            email: input.email,
            createdAt: { gte: new Date(Date.now() - 15 * 60000) },
          },
        });
        if (recentCount >= 3)
          throw new HttpError(
            429,
            "Email này đã gửi nhiều yêu cầu gần đây. Vui lòng chờ 15 phút hoặc liên hệ trực tiếp.",
          );
        const created = await tx.lead.create({
          data: {
            submissionKey: input.submissionKey,
            submissionHash: input.submissionKey ? fingerprint : undefined,
            fullName: input.fullName,
            jobTitle: input.jobTitle,
            organization: input.organization,
            email: input.email,
            phone: input.phone,
            sectorProgramId: sectorProgram?.id,
            sectorLabel: input.sector,
            interests: input.interests as Interest[],
            message: input.message,
            eventId: event?.id,
            userAgent: userAgent?.slice(0, 300),
          },
        });
        await tx.leadEmail.createMany({ data: notificationDrafts(created) });
        return created;
      });
    } catch (error) {
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== "P2002" ||
        !(lead = await existingSubmission())
      )
        throw error;
    }
  // An email failure must never turn a saved consultation into a failed form submission.
  try {
    await deliverLeadEmails(lead.id);
  } catch {
    /* Persistent outbox is visible/retryable in admin. */
  }
  return {
    id: lead.id,
    stored: true,
    ...(env.demoAdminLogin ? {
      adminUrl: `${env.adminAppUrl.replace(/\/$/, "")}/#/leads?id=${encodeURIComponent(lead.id)}`,
    } : {}),
    email: await ownerEmailStatus(lead.id).catch(() => "pending" as const),
  };
}

export async function listLeads(opts: {
  status?: LeadStatus;
  take: number;
  skip: number;
}) {
  if (!prisma) throw new HttpError(503, "Database is not configured");
  const where: Prisma.LeadWhereInput = opts.status
    ? { status: opts.status }
    : {};
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: opts.take,
      skip: opts.skip,
      include: {
        sectorProgram: {
          select: { name: true, tier: { select: { shortLabel: true } } },
        },
        event: { select: { slug: true, title: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);
  return { items, total };
}

export async function updateLead(
  id: string,
  data: { status?: LeadStatus; note?: string },
) {
  if (!prisma) throw new HttpError(503, "Database is not configured");
  const exists = await prisma.lead.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new HttpError(404, "Lead not found");
  return prisma.lead.update({ where: { id }, data });
}

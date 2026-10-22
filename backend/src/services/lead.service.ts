import type { Interest, LeadStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { HttpError } from '../lib/http-error';
import type { LeadResult } from '../../../shared/types';
import type { LeadInputParsed } from '../validators/lead.schema';

export async function createLead(input: LeadInputParsed, userAgent?: string): Promise<LeadResult> {
  if (!prisma) return { id: null, stored: false };

  const [sectorProgram, event] = await Promise.all([
    input.sector ? prisma.sectorProgram.findUnique({ where: { name: input.sector }, select: { id: true } }) : null,
    input.eventSlug ? prisma.event.findUnique({ where: { slug: input.eventSlug }, select: { id: true } }) : null,
  ]);

  const lead = await prisma.lead.create({
    data: {
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
    select: { id: true },
  });
  return { id: lead.id, stored: true };
}

export async function listLeads(opts: { status?: LeadStatus; take: number; skip: number }) {
  if (!prisma) throw new HttpError(503, 'Database is not configured');
  const where: Prisma.LeadWhereInput = opts.status ? { status: opts.status } : {};
  const [items, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: opts.take,
      skip: opts.skip,
      include: {
        sectorProgram: { select: { name: true, tier: { select: { shortLabel: true } } } },
        event: { select: { slug: true, title: true } },
      },
    }),
    prisma.lead.count({ where }),
  ]);
  return { items, total };
}

export async function updateLead(id: string, data: { status?: LeadStatus; note?: string }) {
  if (!prisma) throw new HttpError(503, 'Database is not configured');
  const exists = await prisma.lead.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw new HttpError(404, 'Lead not found');
  return prisma.lead.update({ where: { id }, data });
}

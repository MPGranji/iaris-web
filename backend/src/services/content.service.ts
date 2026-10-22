import { EventKind, EventStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { staticContent, ELEARNING_COURSE_CODE } from '../../../shared/content';
import type {
  Course,
  EventKindCode,
  EventStatusCode,
  Law,
  Lesson,
  MediaService,
  QuizQuestion,
  SectorTier,
  SiteContent,
  SiteEvent,
} from '../../../shared/types';

const STATUS_CODE: Record<EventStatus, EventStatusCode> = {
  UPCOMING: 'up',
  WEBINAR: 'web',
  PAST: 'past',
};
const KIND_CODE: Record<EventKind, EventKindCode> = {
  EVENT: 'ev',
  COMPETITION: 'com',
  WEBINAR: 'web',
  PAST: 'past',
};
export const STATUS_FROM_CODE: Record<EventStatusCode, EventStatus> = {
  up: EventStatus.UPCOMING,
  web: EventStatus.WEBINAR,
  past: EventStatus.PAST,
};

export async function getLaws(): Promise<Law[]> {
  if (!prisma) return staticContent.laws;
  const rows = await prisma.law.findMany({ orderBy: { sortOrder: 'asc' } });
  return rows.map((l) => ({
    name: l.name,
    detail: l.detail,
    effectiveDate: l.effectiveDate.toISOString().slice(0, 10),
  }));
}

export async function getCourses(): Promise<Course[]> {
  if (!prisma) return staticContent.courses;
  const rows = await prisma.course.findMany({ where: { isFoundation: true }, orderBy: { sortOrder: 'asc' } });
  return rows.map(({ code, title, tagline, duration, audience, outcomes }) => ({
    code,
    title,
    tagline,
    duration,
    audience,
    outcomes,
  }));
}

export async function getTiers(): Promise<SectorTier[]> {
  if (!prisma) return staticContent.tiers;
  const rows = await prisma.sectorTier.findMany({
    orderBy: { level: 'asc' },
    include: { programs: { orderBy: { sortOrder: 'asc' } } },
  });
  return rows.map((t) => ({
    level: t.level,
    shortLabel: t.shortLabel,
    label: t.label,
    depth: t.depth,
    introLead: t.introLead,
    introBody: t.introBody,
    programs: t.programs.map(({ name, audience, focus, standards, launchPeriod }) => ({
      name,
      audience,
      focus,
      standards,
      launchPeriod,
    })),
  }));
}

export async function getMedia(group?: string): Promise<MediaService[]> {
  const g = group === 'M1' || group === 'M2' || group === 'M3' ? group : undefined;
  if (!prisma) return staticContent.media.filter((m) => !g || m.group === g);
  const rows = await prisma.mediaService.findMany({
    where: g ? { group: g } : undefined,
    orderBy: [{ group: 'asc' }, { sortOrder: 'asc' }],
  });
  return rows.map(({ group, name, tagline, benefits, meta, featured }) => ({
    group,
    name,
    tagline,
    benefits,
    meta,
    featured,
  }));
}

export async function getEvents(status?: string): Promise<SiteEvent[]> {
  const s = status === 'up' || status === 'web' || status === 'past' ? status : undefined;
  if (!prisma) return staticContent.events.filter((e) => !s || e.status === s);
  const rows = await prisma.event.findMany({
    where: s ? { status: STATUS_FROM_CODE[s] } : undefined,
    orderBy: { sortOrder: 'asc' },
  });
  return rows.map((e) => ({
    slug: e.slug,
    status: STATUS_CODE[e.status],
    kind: KIND_CODE[e.kind],
    dateLabel: e.dateLabel,
    periodLabel: e.periodLabel,
    title: e.title,
    summary: e.summary,
    tags: e.tags,
    ctaLabel: e.ctaLabel,
  }));
}

export async function getElearning(): Promise<{ lessons: Lesson[]; quiz: QuizQuestion[] }> {
  if (!prisma) return { lessons: staticContent.lessons, quiz: staticContent.quiz };
  const course = await prisma.course.findUnique({
    where: { code: ELEARNING_COURSE_CODE },
    include: {
      lessons: { orderBy: { position: 'asc' } },
      questions: { orderBy: { position: 'asc' } },
    },
  });
  if (!course) return { lessons: [], quiz: [] };
  return {
    lessons: course.lessons.map(({ position, title, summary, durationMin }) => ({ position, title, summary, durationMin })),
    quiz: course.questions.map(({ position, scenario, message, options, correctIndex, explanation }) => ({
      position,
      scenario,
      message,
      options,
      correctIndex,
      explanation,
    })),
  };
}

/** Everything the home page needs, in one round trip. */
export async function getSiteContent(): Promise<SiteContent> {
  const [laws, courses, tiers, media, events, el] = await Promise.all([
    getLaws(),
    getCourses(),
    getTiers(),
    getMedia(),
    getEvents(),
    getElearning(),
  ]);
  return {
    laws,
    courses,
    tiers,
    media,
    events,
    lessons: el.lessons,
    quiz: el.quiz,
    source: prisma ? 'database' : 'static',
  };
}

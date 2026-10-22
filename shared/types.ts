// DTOs shared by the frontend and the backend.
// The API always answers with these shapes, whether data comes from PostgreSQL or the static fallback.

export interface Law {
  /** ISO date, e.g. "2025-07-01" */
  effectiveDate: string;
  name: string;
  detail: string;
}

export interface Course {
  code: string;
  title: string;
  tagline: string;
  duration: string;
  audience: string;
  outcomes: string;
}

export type LaunchPeriod = string; // "Q4/2026" | "H1/2027" | "H2/2027" ...

export interface SectorProgram {
  name: string;
  audience: string;
  focus: string;
  standards: string;
  launchPeriod: LaunchPeriod;
}

export interface SectorTier {
  level: number; // 1..3
  shortLabel: string; // "Nhóm 1"
  label: string; // "Nhóm 1 · Hạ tầng trọng yếu"
  depth: number; // meter 1..3
  introLead: string; // bold part of the intro
  introBody: string;
  programs: SectorProgram[];
}

export type MediaGroupCode = 'M1' | 'M2' | 'M3';

export interface MediaService {
  group: MediaGroupCode;
  name: string;
  tagline: string;
  benefits: string[];
  meta: string;
  featured: boolean;
}

/** Tab filter in the Events section */
export type EventStatusCode = 'up' | 'web' | 'past';
/** Colour of the first tag pill */
export type EventKindCode = 'ev' | 'com' | 'web' | 'past';

export interface SiteEvent {
  slug: string;
  status: EventStatusCode;
  kind: EventKindCode;
  dateLabel: string; // big text: "06–07", "72h", "Hằng"
  periodLabel: string; // small mono text under it
  title: string;
  summary: string;
  tags: string[];
  ctaLabel: string;
}

export interface Lesson {
  position: number;
  title: string;
  summary: string;
  durationMin: number;
}

export interface QuizQuestion {
  position: number;
  scenario: string;
  message: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface SiteContent {
  laws: Law[];
  courses: Course[];
  tiers: SectorTier[];
  media: MediaService[];
  events: SiteEvent[];
  /** Lessons of the B6 e-learning course shown in the portal preview */
  lessons: Lesson[];
  /** Quiz of the B6 course */
  quiz: QuizQuestion[];
  /** "database" when served from PostgreSQL, "static" when served from the built-in content */
  source: 'database' | 'static';
}

export const INTEREST_OPTIONS = [
  { code: 'FOUNDATION', value: 'Khóa nền tảng', label: 'Khóa nền tảng' },
  { code: 'SECTOR_PROGRAM', value: 'Chương trình ngành', label: 'Chương trình ngành' },
  { code: 'INHOUSE', value: 'In-house', label: 'In-house / diễn tập' },
  { code: 'ELEARNING', value: 'E-learning', label: 'E-learning' },
  { code: 'MEDIA', value: 'Media', label: 'IARIS Media' },
  { code: 'EVENT_SPONSOR', value: 'Sự kiện', label: 'Tài trợ sự kiện' },
] as const;

export type InterestCode = (typeof INTEREST_OPTIONS)[number]['code'];

export interface LeadInput {
  fullName: string;
  jobTitle?: string;
  organization: string;
  /** Sector name as shown in the dropdown, "Ngành khác", or empty */
  sector?: string;
  email: string;
  phone?: string;
  interests: InterestCode[];
  message?: string;
  /** Set when the visitor clicked a CTA in the Events section */
  eventSlug?: string;
  /** Honeypot – must stay empty */
  website?: string;
}

export interface LeadResult {
  id: string | null;
  /** false when the API runs without a database (request not stored) */
  stored: boolean;
}

export interface QuizAttemptInput {
  courseCode: string;
  answers: number[];
}

export interface QuizAttemptResult {
  score: number;
  total: number;
  stored: boolean;
}

export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

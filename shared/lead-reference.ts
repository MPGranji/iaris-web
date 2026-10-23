import { INTEREST_OPTIONS } from "./types";

export const LEAD_INTEREST_CODES = {
  FOUNDATION: "KH",
  SECTOR_PROGRAM: "NG",
  INHOUSE: "DN",
  ELEARNING: "EL",
  MEDIA: "TT",
  EVENT_SPONSOR: "SK",
} as const;

/** Vietnam time and canonical interest order keep the reference stable and readable. */
export function createLeadReference(
  createdAt: Date,
  interests: readonly string[],
  suffix: string,
) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(createdAt);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)!.value;
  const topics = INTEREST_OPTIONS.filter((option) =>
    interests.some((value) => value === option.code || value === option.label),
  ).map((option) => LEAD_INTEREST_CODES[option.code]).join(".") || "CH";
  return `YC-${part("year")}${part("month")}${part("day")}-${part("hour")}${part("minute")}${part("second")}-${topics}-${suffix.toUpperCase()}`;
}

/** Existing records keep their original IDs and links; only their display label changes. */
export function leadReference(lead: {
  id: string;
  createdAt?: unknown;
  interests?: unknown;
}) {
  if (lead.id.startsWith("YC-")) return lead.id;
  const date = new Date(String(lead.createdAt ?? ""));
  if (!Number.isFinite(date.getTime())) return lead.id;
  const interests = Array.isArray(lead.interests) ? lead.interests.map(String) : [];
  return createLeadReference(date, interests, lead.id.slice(-10));
}

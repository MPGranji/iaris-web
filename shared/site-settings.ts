import type { DemoData, DemoRecord } from "./admin-demo";
import type { SiteContent } from "./types";

export type SiteSection = Record<string, string>;
export const defaultSections: DemoRecord[] = [
  {
    id: "hero",
    name: "Hero",
    title: "An toàn dữ liệu.\nVững vàng tăng trưởng.",
    subtitle: "Đào tạo & truyền thông an ninh mạng theo ngành",
    body: "IARIS Cyber & Data đào tạo an ninh mạng và bảo vệ dữ liệu cho lãnh đạo và đội ngũ doanh nghiệp Việt Nam, thiết kế riêng cho từng ngành. Rủi ro mạng nay là rủi ro kinh doanh, và trách nhiệm cuối cùng thuộc về ban lãnh đạo.",
    buttonLabel: "Xem chương trình đào tạo",
  },
  {
    id: "about",
    name: "Về IARIS",
    title:
      "Viện đào tạo quốc tế dành cho lãnh đạo, bắt đầu từ an ninh mạng và dữ liệu",
    subtitle: "Về IARIS",
    body: "IARIS là viết tắt của International Advancement for Responsible, Inspiring and Strategic Leaders. Trong giai đoạn 2026–2027, IARIS là kênh truyền thông và học viện chuyên về an ninh mạng, dữ liệu theo ngành, vận hành dưới pháp nhân Công ty TNHH M.A.B Solutions.",
  },
  {
    id: "partners",
    name: "Đối tác",
    title: "Đối tác & mạng lưới",
    subtitle: "Kết nối tri thức và kinh nghiệm thực tiễn",
    body: "Hiệp hội An ninh mạng quốc gia (NCA) – Chi hội phía Nam\nVnDSS\nHệ sinh thái MABS Group",
  },
  {
    id: "academy",
    name: "Giới thiệu Academy",
    title: "Chương trình đào tạo theo ngành",
    subtitle: "IARIS Academy",
    body: "Khóa nền tảng, chuyên đề theo ngành, đào tạo in-house và diễn tập.",
    buttonLabel: "Nhận tư vấn chương trình",
  },
  {
    id: "media",
    name: "Giới thiệu Media",
    title: "IARIS Media",
    subtitle: "Truyền thông có trách nhiệm về an ninh mạng và dữ liệu",
    body: "Kênh đồng sở hữu, dịch vụ truyền thông doanh nghiệp, sự kiện và tài trợ.",
  },
  {
    id: "contact",
    name: "Liên hệ",
    title: "Bắt đầu với chương trình phù hợp ngành của bạn",
    subtitle:
      "Nhận lịch khai giảng, học phí và đề xuất chương trình in-house, hoặc báo giá dịch vụ IARIS Media.",
    phone: "",
    email: "",
    address: "TP. Hồ Chí Minh",
    legalEntity: "Công ty TNHH M.A.B Solutions (MABS Group)",
  },
  {
    id: "footer",
    name: "Footer & SEO",
    title: "IARIS",
    subtitle:
      "International Advancement for Responsible, Inspiring and Strategic Leaders",
    body: "IARIS thuộc hệ sinh thái MABS Group – Công ty TNHH M.A.B Solutions, TP. Hồ Chí Minh.",
    seoTitle: "IARIS Cyber & Data",
    seoDescription:
      "Chương trình đào tạo an ninh mạng và bảo vệ dữ liệu cá nhân thiết kế riêng cho từng ngành.",
  },
];

/** Explicit public allowlist: no operational data can enter a published response. */
export function toSiteContent(data: DemoData): SiteContent {
  return {
    source: "database",
    settings: Object.fromEntries(
      data.website.map((row) => [
        row.id,
        Object.fromEntries(
          Object.entries(row).filter(
            ([key, value]) => key !== "id" && typeof value === "string",
          ),
        ),
      ]),
    ) as Record<string, SiteSection>,
    laws: data.laws.map((r) => ({
      name: String(r.name),
      detail: String(r.detail),
      effectiveDate: String(r.effectiveDate),
    })),
    courses: data.courses.map((r) => ({
      code: String(r.code),
      title: String(r.title),
      tagline: String(r.tagline),
      duration: String(r.duration),
      audience: String(r.audience),
      outcomes: String(r.outcomes),
    })),
    tiers: data.tiers.map((t) => ({
      level: Number(t.level),
      shortLabel: String(t.shortLabel),
      label: String(t.label),
      depth: Number(t.depth),
      introLead: String(t.introLead),
      introBody: String(t.introBody),
      programs: data.programs
        .filter((p) => p.tierId === t.id)
        .map((p) => ({
          name: String(p.name),
          audience: String(p.audience),
          focus: String(p.focus),
          standards: String(p.standards),
          launchPeriod: String(p.launchPeriod),
        })),
    })),
    media: data.media.map((r) => ({
      group: r.group as "M1" | "M2" | "M3",
      name: String(r.name),
      tagline: String(r.tagline),
      benefits: r.benefits as string[],
      meta: String(r.meta),
      featured: Boolean(r.featured),
    })),
    events: data.events.map((r) => ({
      slug: String(r.slug),
      status: r.status as "up" | "web" | "past",
      kind: r.kind as "ev" | "com" | "web" | "past",
      title: String(r.title),
      summary: String(r.summary),
      dateLabel: String(r.dateLabel),
      periodLabel: String(r.periodLabel),
      tags: r.tags as string[],
      ctaLabel: String(r.ctaLabel),
    })),
    lessons: data.lessons.map((r) => ({
      position: Number(r.position),
      title: String(r.title),
      summary: String(r.summary),
      durationMin: Number(r.durationMin),
    })),
    quiz: data.quiz.map((r) => ({
      position: Number(r.position),
      scenario: String(r.scenario),
      message: String(r.message),
      options: r.options as string[],
      correctIndex: Number(r.correctIndex),
      explanation: String(r.explanation),
    })),
  };
}

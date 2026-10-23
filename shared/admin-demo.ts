import { staticContent } from "./content";
import { INTEREST_OPTIONS } from "./types";

/** Flat, serializable editor records for the isolated admin demo, never Prisma entities. */
export type DemoValue = string | number | boolean | string[];
export interface DemoRecord {
  id: string;
  [key: string]: DemoValue;
}
export const COLLECTIONS = [
  "website",
  "laws",
  "courses",
  "tiers",
  "programs",
  "media",
  "events",
  "lessons",
  "quiz",
  "leads",
  "members",
] as const;
export type Collection = (typeof COLLECTIONS)[number];
export type DemoData = Record<Collection, DemoRecord[]>;
export interface DemoPublication {
  id: string;
  createdAt: string;
  label: string;
  recordCount: number;
}
export interface DemoWorkspace {
  version: 1;
  data: DemoData;
  publications: DemoPublication[];
  publishedData: DemoData | null;
  changedAt: string | null;
  attempts: DemoAttempt[];
}
export interface DemoAttempt {
  id: string;
  createdAt: string;
  correct: number;
  total: number;
}

export const LEAD_STATUSES = [
  { value: "NEW", label: "Mới" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "QUALIFIED", label: "Tiềm năng" },
  { value: "WON", label: "Đã chốt" },
  { value: "LOST", label: "Không tiếp tục" },
  { value: "SPAM", label: "Spam" },
] as const;

export function createDemoWorkspace(): DemoWorkspace {
  const site = [
    {
      id: "hero",
      name: "Hero",
      title: "An ninh mạng & Dữ liệu cho doanh nghiệp Việt Nam",
      subtitle: "Nâng cao năng lực lãnh đạo, bảo vệ dữ liệu và ứng phó rủi ro.",
      body: "Chương trình đào tạo thiết kế theo ngành, kết nối lãnh đạo, pháp lý và kỹ thuật.",
      buttonLabel: "Khám phá chương trình",
    },
    {
      id: "about",
      name: "Về IARIS",
      title: "Hiểu đúng. Làm được. Vững vàng trước rủi ro.",
      subtitle: "IARIS Cyber & Data",
      body: "Đào tạo an ninh mạng và bảo vệ dữ liệu cho lãnh đạo và đội ngũ doanh nghiệp Việt Nam.",
    },
    {
      id: "partners",
      name: "Đối tác",
      title: "Kết nối tri thức và kinh nghiệm thực tiễn",
      subtitle: "Mạng lưới chuyên gia",
      body: "NCA\nVnDSS\nHội đồng chuyên gia IARIS",
    },
    {
      id: "academy",
      name: "Giới thiệu Academy",
      title: "Chương trình phù hợp với ngành của bạn",
      subtitle: "Từ nhận thức đến năng lực vận hành",
      body: "Khóa nền tảng, chuyên đề theo ngành, đào tạo in-house và diễn tập.",
      buttonLabel: "Xem chương trình",
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
      title: "IARIS Cyber & Data",
      subtitle:
        "Đào tạo an ninh mạng và bảo vệ dữ liệu cho doanh nghiệp Việt Nam.",
      body: "Công ty TNHH M.A.B Solutions (MABS Group)",
      seoTitle: "IARIS Cyber & Data",
      seoDescription:
        "Chương trình đào tạo an ninh mạng và bảo vệ dữ liệu cá nhân thiết kế riêng cho từng ngành.",
    },
  ] as DemoRecord[];
  const names = [
    "Nguyễn Minh Anh",
    "Trần Hoàng Nam",
    "Lê Thảo Nguyên",
    "Phạm Đức Huy",
    "Đỗ Khánh Linh",
    "Vũ Quang Minh",
    "Bùi Hải Yến",
    "Hoàng Tuấn Kiệt",
    "Ngô Phương Thảo",
    "Đặng Gia Bảo",
    "Mai Thanh Hà",
    "Võ Hoàng Phúc",
  ];
  const organizations = [
    "Công ty Minh An",
    "Tài chính Bắc Nam",
    "Công nghệ Hướng Dương",
    "Vận tải Đại Lâm",
    "Y tế An Bình",
    "Năng lượng Sơn Hải",
  ];
  const leads = names.map(
    (fullName, i): DemoRecord => ({
      id: `YC-${String(142 - i).padStart(3, "0")}`,
      fullName,
      organization: organizations[i % organizations.length],
      jobTitle: ["Trưởng phòng pháp chế", "Giám đốc CNTT", "Phụ trách đào tạo"][
        i % 3
      ],
      email: `lienhe${i + 1}@example.com`,
      phone: "",
      sectorLabel: ["Tài chính – Ngân hàng", "Công nghệ thông tin", "Y tế"][
        i % 3
      ],
      interests: [INTEREST_OPTIONS[i % INTEREST_OPTIONS.length].label],
      message:
        i % 2
          ? "Doanh nghiệp muốn tìm hiểu chương trình đào tạo cho đội ngũ quản lý. Nhờ IARIS tư vấn nội dung và lịch phù hợp."
          : "Chúng tôi cần chương trình in-house cho bộ phận pháp chế và CNTT. Mong nhận đề xuất lộ trình và nội dung thực hành.",
      eventTitle: i === 2 ? staticContent.events[0].title : "",
      status: LEAD_STATUSES[i < 3 ? 0 : (i - 2) % LEAD_STATUSES.length].value,
      note:
        i === 3
          ? "Đã trao đổi sơ bộ. Cần gửi đề cương chương trình trong tuần."
          : "",
      createdAt: new Date(
        Date.UTC(2026, 9, 22 - Math.floor(i / 3), 8 - (i % 3), 15),
      ).toISOString(),
      updatedAt: new Date(
        Date.UTC(2026, 9, 22 - Math.floor(i / 3), 8 - (i % 3), 15),
      ).toISOString(),
    }),
  );
  return {
    version: 1,
    data: {
      website: site,
      laws: staticContent.laws.map((r, i) => ({
        ...r,
        id: `law-${i + 1}`,
        sortOrder: i + 1,
      })),
      courses: staticContent.courses.map((r, i) => ({
        ...r,
        id: r.code,
        sortOrder: i + 1,
      })),
      tiers: staticContent.tiers.map(({ programs: _programs, ...r }) => ({
        ...r,
        id: `tier-${r.level}`,
      })),
      programs: staticContent.tiers.flatMap((tier) =>
        tier.programs.map((r, i) => ({
          ...r,
          id: `program-${tier.level}-${i}`,
          tierId: `tier-${tier.level}`,
          sortOrder: i + 1,
        })),
      ),
      media: staticContent.media.map((r, i) => ({
        ...r,
        benefits: [...r.benefits],
        id: `media-${i + 1}`,
        sortOrder: i + 1,
      })),
      events: staticContent.events.map((r, i) => ({
        ...r,
        tags: [...r.tags],
        id: r.slug,
        startsAt: "",
        sortOrder: i + 1,
      })),
      lessons: staticContent.lessons.map((r, i) => ({
        ...r,
        id: `lesson-${i + 1}`,
        courseCode: "B6",
      })),
      quiz: staticContent.quiz.map((r, i) => ({
        ...r,
        options: [...r.options],
        id: `quiz-${i + 1}`,
        courseCode: "B6",
      })),
      leads,
      members: [
        {
          id: "member-1",
          name: "Quản trị demo",
          email: "admin@example.com",
          role: "admin",
          status: "active",
        },
        {
          id: "member-2",
          name: "Biên tập demo",
          email: "editor@example.com",
          role: "editor",
          status: "active",
        },
        {
          id: "member-3",
          name: "Tư vấn demo",
          email: "advisor@example.com",
          role: "advisor",
          status: "inactive",
        },
      ],
    },
    publications: [],
    publishedData: null,
    changedAt: null,
    attempts: [],
  };
}

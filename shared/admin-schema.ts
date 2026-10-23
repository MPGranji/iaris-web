import {
  LEAD_STATUSES,
  type Collection,
  type DemoData,
  type DemoRecord,
} from "./admin-demo";

export type Page = "overview" | Collection | "results" | "publishing";
export type Field = {
  key: string;
  label: string;
  type?:
    | "textarea"
    | "number"
    | "date"
    | "email"
    | "password"
    | "select"
    | "checkbox"
    | "lines";
  required?: boolean;
  hint?: string;
  min?: number;
  max?: number;
  options?: { value: string; label: string }[];
};
export interface CollectionSchema {
  title: string;
  description: string;
  singular: string;
  titleKey: string;
  columns: { key: string; label: string }[];
  fields: Field[];
  filter?: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  };
  orderKey?: string;
}
const text = (key: string, label: string, required = true): Field => ({
  key,
  label,
  required,
});
const area = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "textarea",
  required,
});
const order: Field = {
  key: "sortOrder",
  label: "Thứ tự hiển thị",
  type: "number",
  min: 1,
  max: 9999,
  required: true,
};
export const mediaGroups = [
  { value: "M1", label: "M1 · Kênh đồng sở hữu" },
  { value: "M2", label: "M2 · Dịch vụ doanh nghiệp" },
  { value: "M3", label: "M3 · Sự kiện & tài trợ" },
];
export const eventStatuses = [
  { value: "up", label: "Sắp diễn ra" },
  { value: "web", label: "Webinar" },
  { value: "past", label: "Đã diễn ra" },
];
export const roles = [
  { value: "admin", label: "Quản trị viên" },
  { value: "editor", label: "Biên tập viên" },
  { value: "advisor", label: "Tư vấn viên" },
];
export const memberStatuses = [
  { value: "active", label: "Hoạt động" },
  { value: "inactive", label: "Tạm khóa" },
];

export const schemas: Record<
  Exclude<Collection, "website" | "leads">,
  CollectionSchema
> = {
  laws: {
    title: "Đạo luật",
    description: "Văn bản và ngày hiệu lực hiển thị trên website.",
    singular: "đạo luật",
    titleKey: "name",
    orderKey: "sortOrder",
    columns: [
      { key: "name", label: "Tên văn bản" },
      { key: "detail", label: "Mô tả" },
      { key: "effectiveDate", label: "Ngày hiệu lực" },
    ],
    fields: [
      text("name", "Tên văn bản"),
      area("detail", "Mô tả / số hiệu"),
      {
        key: "effectiveDate",
        label: "Ngày hiệu lực",
        type: "date",
        required: true,
      },
      order,
    ],
  },
  courses: {
    title: "Khóa nền tảng",
    description: "Thông tin khóa học: nội dung, thời lượng và đối tượng.",
    singular: "khóa học",
    titleKey: "title",
    orderKey: "sortOrder",
    columns: [
      { key: "code", label: "Mã" },
      { key: "title", label: "Chương trình" },
      { key: "duration", label: "Thời lượng" },
      { key: "audience", label: "Đối tượng" },
    ],
    fields: [
      text("code", "Mã khóa học"),
      text("title", "Tên chương trình"),
      area("tagline", "Thông điệp"),
      text("duration", "Thời lượng"),
      area("audience", "Đối tượng"),
      area("outcomes", "Kết quả đầu ra"),
      order,
    ],
  },
  tiers: {
    title: "Nhóm ngành",
    description: "Nhóm chương trình và mức độ đào tạo.",
    singular: "nhóm ngành",
    titleKey: "label",
    orderKey: "level",
    columns: [
      { key: "shortLabel", label: "Nhóm" },
      { key: "label", label: "Tên đầy đủ" },
      { key: "depth", label: "Mức học sâu" },
      { key: "introLead", label: "Giới thiệu" },
    ],
    fields: [
      text("shortLabel", "Nhãn ngắn"),
      text("label", "Tên nhóm"),
      {
        key: "level",
        label: "Thứ tự nhóm",
        type: "number",
        required: true,
        min: 1,
        max: 99,
      },
      {
        key: "depth",
        label: "Mức học sâu (1–3)",
        type: "number",
        required: true,
        min: 1,
        max: 3,
      },
      area("introLead", "Dòng giới thiệu chính"),
      area("introBody", "Nội dung giới thiệu"),
    ],
  },
  programs: {
    title: "Chương trình ngành",
    description: "Chương trình đào tạo theo ngành.",
    singular: "chương trình",
    titleKey: "name",
    orderKey: "sortOrder",
    columns: [
      { key: "name", label: "Ngành / lĩnh vực" },
      { key: "tierId", label: "Nhóm" },
      { key: "standards", label: "Chuẩn tham chiếu" },
      { key: "launchPeriod", label: "Dự kiến triển khai" },
    ],
    fields: [
      text("name", "Tên ngành / lĩnh vực"),
      { key: "tierId", label: "Nhóm ngành", type: "select", required: true },
      area("audience", "Đối tượng"),
      area("focus", "Nội dung trọng tâm"),
      text("standards", "Chuẩn tham chiếu"),
      text("launchPeriod", "Kỳ triển khai"),
      order,
    ],
    filter: { key: "tierId", label: "Tất cả nhóm ngành", options: [] },
  },
  media: {
    title: "IARIS Media",
    description: "Biên tập danh mục kênh và dịch vụ truyền thông của IARIS.",
    singular: "dịch vụ",
    titleKey: "name",
    orderKey: "sortOrder",
    columns: [
      { key: "name", label: "Dịch vụ / kênh" },
      { key: "group", label: "Nhóm" },
      { key: "meta", label: "Hình thức" },
      { key: "featured", label: "Nổi bật" },
    ],
    fields: [
      text("name", "Tên dịch vụ / kênh"),
      {
        key: "group",
        label: "Nhóm dịch vụ",
        type: "select",
        options: mediaGroups,
        required: true,
      },
      area("tagline", "Thông điệp"),
      {
        key: "benefits",
        label: "Lợi ích chính",
        type: "lines",
        required: true,
        hint: "Mỗi lợi ích trên một dòng.",
      },
      text("meta", "Hình thức / tần suất"),
      {
        key: "featured",
        label: "Đánh dấu nổi bật trên website",
        type: "checkbox",
      },
      order,
    ],
    filter: {
      key: "group",
      label: "Tất cả nhóm dịch vụ",
      options: mediaGroups,
    },
  },
  events: {
    title: "Sự kiện & webinar",
    description: "Thông tin, thời gian và trạng thái sự kiện.",
    singular: "sự kiện",
    titleKey: "title",
    orderKey: "sortOrder",
    columns: [
      { key: "title", label: "Sự kiện" },
      { key: "status", label: "Phân loại" },
      { key: "periodLabel", label: "Thời gian" },
      { key: "ctaLabel", label: "Nút hành động" },
    ],
    fields: [
      text("title", "Tên sự kiện"),
      text("slug", "Đường dẫn định danh (slug)"),
      area("summary", "Tóm tắt"),
      {
        key: "status",
        label: "Tab hiển thị",
        type: "select",
        options: eventStatuses,
        required: true,
      },
      {
        key: "kind",
        label: "Loại nhãn",
        type: "select",
        options: [
          { value: "ev", label: "Diễn đàn / roundtable" },
          { value: "com", label: "Cuộc thi" },
          { value: "web", label: "Webinar" },
          { value: "past", label: "Đã diễn ra" },
        ],
        required: true,
      },
      text("dateLabel", "Nhãn ngày (ví dụ: 06–07)"),
      text("periodLabel", "Nhãn kỳ (ví dụ: Tháng 11 · 2026)"),
      { key: "startsAt", label: "Ngày bắt đầu (nếu đã chốt)", type: "date" },
      {
        key: "tags",
        label: "Thẻ nội dung",
        type: "lines",
        hint: "Mỗi thẻ trên một dòng.",
      },
      text("ctaLabel", "Nhãn nút hành động"),
      order,
    ],
    filter: { key: "status", label: "Tất cả sự kiện", options: eventStatuses },
  },
  lessons: {
    title: "Bài học",
    description: "Biên tập nội dung e-learning minh họa của chương trình B6.",
    singular: "bài học",
    titleKey: "title",
    orderKey: "position",
    columns: [
      { key: "position", label: "Bài" },
      { key: "title", label: "Tên bài học" },
      { key: "summary", label: "Tóm tắt" },
      { key: "durationMin", label: "Phút" },
    ],
    fields: [
      text("title", "Tên bài học"),
      area("summary", "Tóm tắt nội dung"),
      {
        key: "durationMin",
        label: "Thời lượng (phút)",
        type: "number",
        min: 1,
        max: 600,
        required: true,
      },
      {
        key: "position",
        label: "Thứ tự bài học",
        type: "number",
        min: 1,
        max: 999,
        required: true,
      },
    ],
  },
  quiz: {
    title: "Câu hỏi tình huống",
    description: "Xây dựng bộ câu hỏi, đáp án và lời giải cho khóa B6.",
    singular: "câu hỏi",
    titleKey: "scenario",
    orderKey: "position",
    columns: [
      { key: "position", label: "Câu" },
      { key: "scenario", label: "Tình huống" },
      { key: "options", label: "Các lựa chọn" },
    ],
    fields: [
      text("scenario", "Tên tình huống"),
      area("message", "Nội dung email / tin nhắn / cuộc gọi"),
      {
        key: "options",
        label: "Các đáp án",
        type: "lines",
        required: true,
        hint: "Từ 2 đến 8 đáp án, mỗi đáp án trên một dòng.",
      },
      {
        key: "correctIndex",
        label: "Đáp án đúng",
        type: "select",
        required: true,
      },
      area("explanation", "Giải thích đáp án"),
      {
        key: "position",
        label: "Thứ tự câu hỏi",
        type: "number",
        required: true,
        min: 1,
        max: 999,
      },
    ],
  },
  members: {
    title: "Tài khoản & phân quyền",
    description:
      "Quản lý tài khoản đăng nhập và quyền truy cập nội dung, tư vấn, xuất bản.",
    singular: "tài khoản",
    titleKey: "name",
    columns: [
      { key: "name", label: "Thành viên" },
      { key: "email", label: "Email" },
      { key: "role", label: "Vai trò" },
      { key: "status", label: "Trạng thái" },
    ],
    fields: [
      text("name", "Tên hiển thị"),
      {
        key: "email",
        label: "Email đăng nhập",
        type: "email",
        required: true,
        hint: "Email dùng để đăng nhập; chưa gửi thư mời tự động.",
      },
      {
        key: "password",
        label: "Mật khẩu mới",
        type: "password",
        hint: "Ít nhất 12 ký tự khi tạo mới. Để trống khi giữ mật khẩu hiện tại.",
      },
      {
        key: "role",
        label: "Vai trò",
        type: "select",
        options: roles,
        required: true,
      },
      {
        key: "status",
        label: "Trạng thái",
        type: "select",
        options: memberStatuses,
        required: true,
      },
    ],
  },
};

export function schemaFor(
  collection: keyof typeof schemas,
  data: DemoData,
): CollectionSchema {
  const schema = schemas[collection];
  const tiers = data.tiers.map((r) => ({
    value: r.id,
    label: String(r.label),
  }));
  return {
    ...schema,
    fields: schema.fields.map((f) =>
      f.key === "tierId" ? { ...f, options: tiers } : f,
    ),
    filter:
      schema.filter?.key === "tierId"
        ? { ...schema.filter, options: tiers }
        : schema.filter,
  };
}

export function newRecord(
  collection: keyof typeof schemas,
  data: DemoData,
): DemoRecord {
  const schema = schemaFor(collection, data);
  const result: DemoRecord = { id: crypto.randomUUID() };
  for (const f of schema.fields)
    result[f.key] =
      f.type === "checkbox"
        ? false
        : f.type === "lines"
          ? []
          : f.type === "number"
            ? (f.min ?? 1)
            : f.type === "select"
              ? (f.options?.[0]?.value ?? "")
              : "";
  if (schema.orderKey)
    result[schema.orderKey] =
      Math.max(
        0,
        ...data[collection].map((r) => Number(r[schema.orderKey!] || 0)),
      ) + 1;
  if (collection === "quiz") result.correctIndex = 0;
  if (collection === "lessons" || collection === "quiz")
    result.courseCode = "B6";
  return result;
}

export function validateRecord(
  collection: Collection,
  row: DemoRecord,
  data: DemoData,
): string | null {
  const others = data[collection].filter((r) => r.id !== row.id);
  const uniqueKey =
    collection === "courses"
      ? "code"
      : collection === "events"
        ? "slug"
        : collection === "tiers"
          ? "level"
          : collection === "members"
            ? "email"
            : null;
  if (
    uniqueKey &&
    others.some(
      (r) =>
        String(r[uniqueKey]).trim().toLowerCase() ===
        String(row[uniqueKey]).trim().toLowerCase(),
    )
  )
    return "Mã, đường dẫn hoặc email này đã tồn tại. Vui lòng dùng giá trị khác.";
  if (
    collection === "events" &&
    !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(row.slug))
  )
    return "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang.";
  if (collection === "quiz") {
    const options = row.options;
    if (!Array.isArray(options) || options.length < 2 || options.length > 8)
      return "Câu hỏi cần từ 2 đến 8 đáp án.";
    if (
      !Number.isInteger(Number(row.correctIndex)) ||
      Number(row.correctIndex) < 0 ||
      Number(row.correctIndex) >= options.length
    )
      return "Vui lòng chọn đáp án đúng trong danh sách.";
  }
  if (
    collection === "members" &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(row.email))
  )
    return "Email đăng nhập không hợp lệ.";
  if (
    collection === "members" &&
    row.password &&
    String(row.password).length < 12
  )
    return "Mật khẩu cần ít nhất 12 ký tự.";
  if (collection === "programs" && !data.tiers.some((r) => r.id === row.tierId))
    return "Vui lòng chọn một nhóm ngành hiện có.";
  if (
    (collection === "lessons" || collection === "quiz") &&
    others.some((r) => r.position === row.position)
  )
    return "Thứ tự này đã có. Vui lòng chọn số khác.";
  return null;
}

export function validateFields(
  fields: Field[],
  row: DemoRecord,
): string | null {
  for (const field of fields) {
    const value = row[field.key];
    if (
      field.required &&
      (value === undefined ||
        value === "" ||
        (typeof value === "string" && !value.trim()) ||
        (Array.isArray(value) && !value.some((s) => s.trim())))
    )
      return `Vui lòng nhập ${field.label.toLowerCase()}.`;
    if (
      field.type === "number" &&
      value !== "" &&
      (typeof value !== "number" ||
        !Number.isInteger(value) ||
        (field.min !== undefined && value < field.min) ||
        (field.max !== undefined && value > field.max))
    )
      return `${field.label} cần là số nguyên trong khoảng ${field.min ?? 0}–${field.max ?? 9999}.`;
    if (
      field.type === "select" &&
      field.options?.length &&
      !field.options.some((option) => option.value === String(value))
    )
      return `Vui lòng chọn ${field.label.toLowerCase()} hợp lệ.`;
  }
  return null;
}

export const pageTitle = (page: Page) =>
  page === "overview"
    ? "Tổng quan"
    : page === "website"
      ? "Nội dung website"
      : page === "leads"
        ? "Yêu cầu tư vấn"
        : page === "results"
          ? "Kết quả quiz"
          : page === "publishing"
            ? "Xuất bản"
            : schemas[page].title;

export const matchesSearch = (row: DemoRecord, query: string) => {
  const normalize = (s: string) =>
    s
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[đĐ]/g, "d")
      .toLowerCase();
  return normalize(Object.values(row).join(" ")).includes(
    normalize(query.trim()),
  );
};
export const formatDate = (value: unknown, time = false) => {
  const d = new Date(String(value));
  return Number.isNaN(d.getTime())
    ? "Chưa cập nhật"
    : new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        ...(time ? ({ hour: "2-digit", minute: "2-digit" } as const) : {}),
      }).format(d);
};
export function displayValue(
  key: string,
  value: unknown,
  data?: DemoData,
): string {
  if (value === "" || value === null || value === undefined)
    return "Chưa cập nhật";
  if (Array.isArray(value)) return value.join(" · ");
  if (typeof value === "boolean") return value ? "Có" : "Không";
  if (key === "tierId")
    return String(
      data?.tiers.find((r) => r.id === value)?.shortLabel ?? "Chưa chọn nhóm",
    );
  if (key === "effectiveDate" || key.endsWith("At")) return formatDate(value);
  const options =
    key === "role"
      ? roles
      : key === "group"
        ? mediaGroups
        : key === "status"
          ? [...LEAD_STATUSES, ...eventStatuses, ...memberStatuses]
          : [];
  return options.find((o) => o.value === value)?.label ?? String(value);
}

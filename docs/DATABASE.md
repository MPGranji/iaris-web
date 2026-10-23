# Cập nhật sandbox 23/10/2026

Repo sandbox đã nối website/admin với PostgreSQL và bổ sung tài khoản, phiên, phân quyền, cấu hình nội dung,
bản xuất bản và nhật ký thao tác. Thiết kế hiện tại và cách chạy: [SANDBOX-DATABASE.md](SANDBOX-DATABASE.md).
Phân tích bên dưới giữ lại làm bối cảnh thiết kế trước khi tích hợp.

# Phân tích cơ sở dữ liệu – IARIS Cyber & Data

PostgreSQL + Prisma ORM. Schema: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma) ·
Migration: [`backend/prisma/migrations`](../backend/prisma/migrations) · Seed: [`backend/prisma/seed.ts`](../backend/prisma/seed.ts)

## 0. Ghi nhận hiện trạng ngày 22/10/2026

Phân tích dựa trên code tại commit `62897f7`, gồm schema, migration khởi tạo, seed, service, validator,
route và cách frontend chọn chế độ lưu dữ liệu. Đây là kiểm kê thiết kế trong repo; chưa truy cập
máy chủ PostgreSQL để kiểm kê bảng hoặc bản ghi thực tế.

| Hạng mục | Hiện trạng đã kiểm tra |
|---|---|
| Website | https://iaris-web.vercel.app/ |
| `GET /api/health` | HTTP 200, `ok: true`, `database: "static-content"` |
| `GET /api/content` | HTTP 200, `source: "static"` |
| Database trên deployment này | API đang chạy không có `DATABASE_URL` được cấu hình; chưa dùng PostgreSQL |
| Thiết kế đã có | 10 bảng nghiệp vụ, 5 enum, 6 quan hệ khóa ngoại; 1 migration `20261022000000_init` |
| Dữ liệu chuẩn bị sẵn | `shared/content.ts`: 59 dòng nội dung nếu seed vào database mới |
| Form và quiz hiện tại | Demo tại trình duyệt; không gửi POST lưu dữ liệu khi `source` là `static` |
| Phạm vi lần ghi nhận này | Chỉ cập nhật tài liệu; không sửa FE, BE, schema, migration, seed, biến môi trường; không chạy migration/seed hay deploy |

**Lưu ý về health:** giá trị `configured` chỉ có nghĩa biến `DATABASE_URL` không rỗng.
Endpoint này không thử kết nối, kiểm tra migration hay kiểm tra seed; không dùng nó làm bằng chứng DB đã sẵn sàng.

## 1. Từ giao diện đến thực thể

Trang gốc chứa toàn bộ dữ liệu trong các mảng JavaScript. Mỗi mảng trở thành một bảng:

| Trên giao diện | Mảng trong bản gốc | Bảng | Ghi chú |
|---|---|---|---|
| Hero – "4 đạo luật · 12 tháng" | (HTML tĩnh) | `Law` | ngày hiệu lực lưu kiểu `DATE` |
| 6 khóa nền tảng B1–B6 | `F` | `Course` | `code` là khóa tự nhiên (unique) |
| Tabs Nhóm 1/2/3 + meter | `T` | `SectorTier` | `depth` = số vạch sáng trên meter |
| Bảng chương trình chuyên ngành | `T[].rows` | `SectorProgram` | cũng là danh sách "Ngành" trong form |
| 15 dịch vụ IARIS Media | `M` | `MediaService` | `group` enum M1/M2/M3, `featured` = thẻ xanh đậm |
| Sự kiện & Webinar | `E` | `Event` | `status` = tab lọc, `kind` = màu pill |
| Cổng học viên B6 (6 bài) | `L` | `Lesson` | thuộc `Course` B6 |
| Quiz "Bạn có nhận ra lừa đảo?" | `Q` | `QuizQuestion` | thuộc `Course` B6 |
| Kết quả quiz | (chỉ ở client) | `QuizAttempt` | **mới** – để thống kê |
| Form "Đăng ký và tư vấn" | (chưa gửi đi) | `Lead` | **mới** – lưu yêu cầu tư vấn |

Các con số ở dải thống kê (6 khóa, 16 ngành, 15 dịch vụ, 3 nhóm) **không lưu** mà được tính từ số dòng
của các bảng tương ứng, nên luôn khớp với dữ liệu.

Nội dung mang tính trình bày (sứ mệnh, 7 nguyên tắc biên tập, hình thức học…) giữ trong component React
vì hiếm khi đổi và không có quan hệ với dữ liệu khác.

### Kiểm kê dữ liệu đầu vào

Đây là số lượng trong `shared/content.ts`, cũng khớp API nội dung tĩnh tại thời điểm ghi nhận.
Không phải số dòng đã lưu trong PostgreSQL.

| Bảng | Số dòng seed trên DB mới | Khóa/đặc điểm chính |
|---|---:|---|
| `Law` | 4 | Ngày hiệu lực là `DATE`; chưa có khóa nghiệp vụ unique |
| `Course` | 6 | `code` unique, B1–B6; các khóa seed mặc định là nền tảng |
| `SectorTier` | 3 | `level` unique; độ sâu lần lượt 3, 2, 1 |
| `SectorProgram` | 16 | `name` unique; Nhóm 1: 5, Nhóm 2: 6, Nhóm 3: 5 |
| `MediaService` | 15 | M1: 5, M2: 6, M3: 4; chưa có khóa nghiệp vụ unique |
| `Event` | 6 | `slug` unique; `up`: 3, `web`: 2, `past`: 1 |
| `Lesson` | 6 | Thuộc B6; `(courseId, position)` unique; mỗi bài 15 phút |
| `QuizQuestion` | 3 | Thuộc B6; `(courseId, position)` unique; mỗi câu 3 đáp án, `correctIndex` hiện là 1 |
| `Lead` | 0 do seed | Seed không tạo yêu cầu tư vấn; dữ liệu sẽ phát sinh khi bật lưu thật |
| `QuizAttempt` | 0 do seed | Seed không tạo lượt làm bài; dữ liệu sẽ phát sinh khi bật lưu thật |

Migration Prisma còn có bảng kỹ thuật `_prisma_migrations` khi được áp dụng bằng Prisma;
bảng này không nằm trong 10 model nghiệp vụ kể trên.

## 2. Sơ đồ quan hệ (ERD)

```mermaid
erDiagram
    SectorTier ||--o{ SectorProgram : "gồm"
    SectorProgram |o--o{ Lead : "ngành của"
    Event |o--o{ Lead : "đăng ký từ"
    Course ||--o{ Lesson : "có"
    Course ||--o{ QuizQuestion : "có"
    Course ||--o{ QuizAttempt : "được làm"

    Law {
      string id PK
      string name
      string detail
      date effectiveDate
      int sortOrder
    }
    Course {
      string id PK
      string code UK "B1..B6"
      string title
      string tagline
      string duration
      string audience
      string outcomes
      bool isFoundation
      int sortOrder
    }
    SectorTier {
      string id PK
      int level UK "1..3"
      string shortLabel
      string label
      int depth
      string introLead
      string introBody
    }
    SectorProgram {
      string id PK
      string tierId FK
      string name UK
      string audience
      string focus
      string standards
      string launchPeriod "Q4/2026, H1/2027..."
      int sortOrder
    }
    MediaService {
      string id PK
      enum group "M1|M2|M3"
      string name
      string tagline
      string_array benefits
      string meta
      bool featured
      int sortOrder
    }
    Event {
      string id PK
      string slug UK
      enum status "UPCOMING|WEBINAR|PAST"
      enum kind "EVENT|COMPETITION|WEBINAR|PAST"
      string dateLabel
      string periodLabel
      datetime startsAt "nullable"
      string title
      string summary
      string_array tags
      string ctaLabel
    }
    Lesson {
      string id PK
      string courseId FK
      int position
      string title
      string summary
      int durationMin
    }
    QuizQuestion {
      string id PK
      string courseId FK
      int position
      string scenario
      string message
      string_array options
      int correctIndex
      string explanation
    }
    QuizAttempt {
      string id PK
      string courseId FK
      int_array answers
      int score
      int total
      datetime createdAt
    }
    Lead {
      string id PK
      string fullName
      string jobTitle
      string organization
      string email
      string phone
      string sectorProgramId FK
      string sectorLabel
      enum_array interests
      string message
      string eventId FK
      enum status "NEW..SPAM"
      string note
      datetime createdAt
    }
```

## 3. Quyết định thiết kế

- **Khóa chính `cuid()`** thay vì số tự tăng. Việc giữ ID khi seed lại phụ thuộc vào `upsert`
  theo khóa nghiệp vụ; các bảng bị xóa rồi tạo lại sẽ nhận ID mới.
- **Khóa tự nhiên unique** (`Course.code`, `SectorTier.level`, `SectorProgram.name`, `Event.slug`) cho phép
  seed theo kiểu *upsert* – cập nhật nội dung mà không làm gãy khóa ngoại của `Lead`/`QuizAttempt`.
- **Thứ tự hiển thị**: `sortOrder` ở `Law`, `Course`, `SectorProgram`, `MediaService`, `Event`;
  `SectorTier` dùng `level`; `Lesson` và `QuizQuestion` dùng `position`.
- **Mảng PostgreSQL** (`String[]`, `Int[]`, `Interest[]`) cho các danh sách ngắn, không cần truy vấn riêng
  (benefits, tags, options, answers, interests) – tránh thêm bảng nối không cần thiết.
- **Enum** cho các tập giá trị cố định (`MediaGroup`, `EventStatus`, `EventKind`, `Interest`, `LeadStatus`).
  API chuyển enum sang mã ngắn (`up/web/past`, `ev/com/web/past`) mà frontend dùng làm class CSS.
- **`Lead.sectorLabel`** lưu *snapshot* tên ngành lúc gửi, bên cạnh khóa ngoại `sectorProgramId`
  (`ON DELETE SET NULL`): đổi/xóa ngành không làm mất thông tin của lead cũ; "Ngành khác" vẫn lưu được.
- **`Lead.eventId`**: khi khách bấm CTA ở mục Sự kiện, form được điền sẵn và lead được gắn với sự kiện →
  đo được sự kiện nào tạo ra nhiều yêu cầu tư vấn.
- **`Lead.status` + `note`**: đủ để ghi nhận pipeline sales (NEW → CONTACTED → QUALIFIED → WON/LOST, SPAM).
  Đây là quy trình dự kiến; API hiện cho phép chuyển trực tiếp giữa các trạng thái, chưa kiểm soát từng bước.
- **`QuizAttempt`**: server tự chấm lại điểm (không tin điểm từ client) và lưu để thống kê tỷ lệ nhận diện
  lừa đảo – số liệu dùng được cho truyền thông.
- **Chỉ mục**: `Lead(status, createdAt)` cho màn hình quản lý, `Lead(email)` để tra trùng,
  `QuizAttempt(courseId, createdAt)` cho thống kê theo thời gian, `(group|status|tierId, sortOrder)` cho các truy vấn hiển thị.
- **Dữ liệu liên hệ**: `Lead` lưu họ tên, chức vụ, doanh nghiệp, email, điện thoại, nội dung và `userAgent`.
  Đọc/cập nhật lead qua API yêu cầu `ADMIN_TOKEN`; tạo lead là endpoint công khai.
  `QuizAttempt` chưa có trường tài khoản, email hay khóa ngoại đến lead. Thiết kế hiện tại chưa có
  cơ chế lưu lịch sử đồng ý, thời hạn lưu, xóa dữ liệu hay nhật ký truy cập.

## 4. Mở rộng gợi ý

| Nhu cầu | Thay đổi |
|---|---|
| Trang chi tiết khóa học | thêm `Course.slug`, `Course.description` (markdown), bảng `CourseSession` (lịch khai giảng, địa điểm, học phí) |
| Đăng ký học thật | bảng `Enrollment(leadId/userId, sessionId, status)` |
| Cổng e-learning thật | bảng `User`, `LessonProgress(userId, lessonId, completedAt)` – thay cho state minh họa ở client |
| Bản tin Cyber Brief | bảng `Subscriber(email, confirmedAt, unsubscribedAt)` |
| CMS cho nội dung | dùng Prisma Studio (`npm run db:studio`) hoặc thêm trang admin gọi API |

Các mục mở rộng trên là hướng phát triển, chưa được triển khai.

## 5. Luồng đọc/ghi dữ liệu hiện có

### Đọc nội dung và chuyển chế độ

1. Frontend render ngay từ `shared/content.ts`, sau đó gọi `GET /api/content`.
2. Không có `DATABASE_URL`: service trả nội dung tĩnh, `source: "static"`; Prisma client là `null`.
3. Có `DATABASE_URL`: service truy vấn các bảng, sắp xếp và chuyển sang DTO, trả `source: "database"`.
4. Frontend chỉ thay nội dung nếu response có `courses.length > 0`. Khi nhận `source: "database"`,
   form và quiz tự chuyển sang gửi dữ liệu lưu thật, không có cờ bật riêng.
5. Nếu kết nối/truy vấn DB lỗi, API trả lỗi; backend **không** tự đổi về nội dung tĩnh trong trường hợp này.
   Frontend giữ nội dung đang có. Lần tải mới sẽ giữ bản tĩnh và chế độ demo nếu không lấy được nội dung DB.

Các truy vấn trong `/api/content` chạy song song, không nằm trong cùng một transaction đọc.
Điều kiện `courses.length > 0` chưa kiểm tra đủ các nhóm nội dung; DB seed thiếu B6 vẫn có thể trả
`lessons: []`, `quiz: []` và khiến frontend chuyển sang nguồn database.

### Những endpoint có liên quan đến lưu trữ

| Endpoint | Quyền | Không có DB | Có DB |
|---|---|---|---|
| `GET /api/content` và các endpoint nội dung | Công khai | Đọc `shared/content.ts` | Đọc các bảng nội dung |
| `POST /api/leads` | Công khai | HTTP 202, `id: null`, `stored: false` | Tạo `Lead`, HTTP 201 |
| `POST /api/quiz-attempts` | Công khai | Chấm B6 từ nội dung tĩnh, HTTP 200, `stored: false` | Chấm từ câu hỏi hiện tại và tạo `QuizAttempt`, HTTP 201 |
| `GET /api/leads` | Bearer `ADMIN_TOKEN` | HTTP 503 khi đã qua xác thực | Phân trang, lọc `status`, sắp mới nhất trước; response `no-store` |
| `PATCH /api/leads/:id` | Bearer `ADMIN_TOKEN` | HTTP 503 khi đã qua xác thực | Sửa `status`, `note`; không có nhật ký thay đổi |

Frontend hiện không gọi hai endpoint POST khi dùng nội dung tĩnh, nhưng các endpoint này vẫn tồn tại.
Thiếu `ADMIN_TOKEN` trả 503; token sai hoặc thiếu khi server đã cấu hình token trả 401.
Chưa có API quản trị nội dung hoặc API đọc lịch sử quiz.

### Tạo yêu cầu tư vấn

- Bắt buộc `fullName`, `organization`, email đúng định dạng; email được trim và chuyển chữ thường.
- Giới hạn tại validator: tên/chức vụ 120 ký tự, doanh nghiệp/ngành/email 200, điện thoại 30,
  nội dung 2.000; điện thoại kiểm tra tập ký tự, chưa xác minh số có thật.
- Tra ngành theo **tên**, sự kiện theo **slug**. Không tìm thấy thì lưu FK `null`, vẫn tạo lead;
  `sectorLabel` giữ nguyên tên ngành đã gửi, gồm cả "Ngành khác".
- `interests` dùng 6 mã enum. Validator giới hạn số phần tử nhưng chưa loại phần tử trùng.
- `website` là honeypot phải rỗng; chưa có rate limit, chống gửi lặp hay khóa idempotency.
- `email` chỉ có index, không unique: cùng email có thể gửi nhiều yêu cầu, không phải tài khoản người dùng.

### Làm quiz

- Server nhận `courseCode`, mảng chỉ số đáp án; tính lại `score`, không nhận điểm do client tự khai.
- Khi có DB, kiểm tra số đáp án bằng số câu hỏi. Chưa kiểm tra từng chỉ số theo số lựa chọn của câu đó;
  validator chỉ giới hạn chung từ 0 đến 10, nên chỉ số không tồn tại có thể được chấm như đáp án sai.
- Nhánh không có DB chưa kiểm tra số đáp án bằng số câu hỏi.
- Lưu `answers`, `score`, `total`, `courseId`, thời điểm; chưa có người làm, phiên bản bộ đề,
  ID từng câu hoặc snapshot nội dung câu hỏi tại thời điểm làm.
- API công khai trả cả `correctIndex` và `explanation`. Phù hợp quiz minh họa; chưa phù hợp bài thi có chứng nhận.
- Tiến độ bài học hiện nằm trong React state, mặc định 2/6 bài; không ghi xuống DB và mất khi tải lại trang.

## 6. Seed, ràng buộc và hành vi xóa

### Seed hiện làm gì

Toàn bộ ghi nội dung nằm trong một transaction, timeout 60 giây.

| Nhóm dữ liệu | Cách seed | Tác động cần biết |
|---|---|---|
| `Law`, `MediaService` | Xóa tất cả rồi tạo lại | ID và thời điểm tạo thay đổi; chỉnh sửa nội dung trực tiếp trong DB bị ghi đè |
| `Course`, `SectorTier`, `SectorProgram`, `Event` | Upsert theo code/level/name/slug | Giữ ID khi khóa không đổi; ghi đè các trường nội dung có trong seed |
| Bài học và câu hỏi B6 | Xóa rồi tạo lại cho B6 | ID thay đổi; không có phiên bản lịch sử |
| `Lead`, `QuizAttempt` | Không ghi/xóa trực tiếp | Bản ghi được giữ; việc đổi câu hỏi vẫn làm mất khả năng diễn giải chính xác đáp án cũ |

Seed **không xóa** khóa học, nhóm ngành, ngành và sự kiện đã bị gỡ khỏi `shared/content.ts`.
Đổi tên ngành hoặc đổi slug sự kiện tạo dòng mới, dòng cũ vẫn còn và có thể tiếp tục được API hiển thị.
`Event.startsAt` chưa được seed gán và chưa được service dùng để tự chuyển trạng thái `PAST`.

### Quan hệ khi xóa

| Xóa bản ghi cha | Hành vi đã khai báo |
|---|---|
| `SectorTier` | Cascade xóa các `SectorProgram`; lead liên quan giữ lại, `sectorProgramId` thành `null` |
| `SectorProgram` | Lead giữ lại, FK thành `null`; `sectorLabel` vẫn còn |
| `Event` | Lead giữ lại, `eventId` thành `null`; chưa có trường snapshot riêng cho tên sự kiện |
| `Course` | Cascade xóa bài học, câu hỏi **và toàn bộ `QuizAttempt`** của khóa đó |

### Ràng buộc hiện có và còn thiếu

- Migration có 10 khóa chính, 6 unique index nghiệp vụ, 8 index thường và 6 khóa ngoại,
  tương ứng cấu trúc model hiện tại. Chưa kiểm tra drift với database thực tế.
- Các cột text là PostgreSQL `TEXT`; giới hạn độ dài nói trên nằm ở API, không phải DB.
- Chưa có `CHECK` cho `depth/level` trong 1–3, `position` dương, thời lượng dương,
  chỉ số đáp án hợp lệ hay `0 <= score <= total`.
- Các cột mảng trong SQL migration chưa có `NOT NULL` hoặc default mảng rỗng, dù model Prisma dùng kiểu mảng
  không optional. Ghi SQL trực tiếp có thể tạo trạng thái khác kỳ vọng của ứng dụng.
- Chưa có index riêng cho `Lead.eventId` và `Lead.sectorProgramId`; chỉ cân nhắc bổ sung khi có
  truy vấn thống kê theo sự kiện/ngành và dữ liệu đủ lớn, dựa trên kế hoạch thực thi thực tế.
- `SectorTier`, `SectorProgram`, `Lesson`, `QuizQuestion` chưa có timestamps;
  các bảng có `updatedAt` cũng chưa lưu ai sửa và lịch sử trước/sau.

## 7. Phạm vi hiện tại và việc cần quyết định sau này

Thiết kế hiện tại phục vụ **nội dung website, yêu cầu tư vấn và lượt làm quiz minh họa**.
Chưa có tài khoản/role, lớp khai giảng, học phí/thanh toán, đăng ký học chính thức, video/tệp bài học,
tiến độ người học, chứng nhận, người đăng ký bản tin, thông báo email hay CMS nghiệp vụ.
`SectorProgram` cũng chưa có quan hệ đến `Course`: một bên là chương trình theo ngành, một bên là khóa nền tảng.
Lead chưa ghi nhận người gửi đang hỏi chính xác khóa học nào; `interests` chỉ là nhóm quan tâm.

| Thời điểm | Việc cần chốt trước khi triển khai |
|---|---|
| Trước khi bật DB | Chọn môi trường dev/staging/production; xác minh migration, seed đầy đủ và kết nối thật; backup/khôi phục; quản lý secrets và connection pool |
| Trước khi nhận lead thật | Chốt trường dữ liệu, cách ghi nhận đồng ý và thời hạn lưu/xóa; chống spam/gửi lặp; phân quyền người xử lý; thông báo lead mới; lịch sử sửa |
| Trước khi dùng quiz để đánh giá | Phiên bản bộ đề và snapshot đáp án; kiểm tra chỉ số; không công khai đáp án trước khi làm; quy tắc nhận diện người học và số lượt làm |
| Trước khi có cổng học viên | `User`, lớp/đợt học, `Enrollment`, quyền truy cập tài liệu, `LessonProgress`; tách nội dung demo khỏi dữ liệu học thật |
| Trước khi quản lý nội dung thường xuyên | Khóa nghiệp vụ ổn định, draft/publish/archive, quy tắc seed không ghi đè CMS, người sửa và audit log |

**Điểm cần nhớ khi quay lại:** chỉ cấu hình DB và seed cũng có thể làm frontend hiện tại tự bật lưu thật,
vì điều kiện là `content.source === 'database'`. Cần kiểm tra và quyết định thời điểm chuyển chế độ;
không coi thao tác kết nối DB chỉ là thay đổi hạ tầng không ảnh hưởng hành vi.

Các mục trên chỉ được ghi nhận để phát triển sau; chưa áp dụng thay đổi vào ứng dụng.

## 8. Nguồn để tiếp tục công việc

- Cấu trúc và ràng buộc: `backend/prisma/schema.prisma`, `backend/prisma/migrations/20261022000000_init/migration.sql`.
- Nội dung mẫu và cách nạp: `shared/content.ts`, `backend/prisma/seed.ts`.
- Đọc nội dung: `backend/src/services/content.service.ts`.
- Ghi/đọc lead: `backend/src/services/lead.service.ts`, `backend/src/validators/lead.schema.ts`, `backend/src/controllers/lead.controller.ts`.
- Chấm/lưu quiz: `backend/src/services/quiz.service.ts`, `backend/src/validators/quiz.schema.ts`.
- Quyền admin và chế độ DB: `backend/src/middlewares/require-admin.ts`, `backend/src/config/env.ts`, `backend/src/lib/prisma.ts`.
- Điểm frontend đổi chế độ: `frontend/src/hooks/useSiteContent.ts`, `frontend/src/App.tsx`, `frontend/src/sections/Contact.tsx`, `frontend/src/sections/Elearning.tsx`.
- Biến cấu hình và lệnh có sẵn: `.env.example`, `backend/package.json`, `README.md`.

Không ghi chuỗi kết nối, token hoặc dữ liệu khách hàng vào tài liệu này.

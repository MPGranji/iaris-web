# IARIS Cyber & Data – Website

Website giới thiệu IARIS Cyber & Data: đào tạo & truyền thông an ninh mạng theo ngành.
Monorepo gồm **Frontend** (React 19 + Vite + TypeScript) và **Backend** (Express 5 + Prisma + PostgreSQL),
deploy trên **một project Vercel** (frontend tĩnh + API serverless cùng domain).

## Cấu trúc thư mục

```
IARIS/
├─ api/
│  └─ index.ts              # Vercel Serverless Function: mọi request /api/* → Express app
├─ backend/                 # BE – Express 5 + Prisma
│  ├─ prisma/
│  │  ├─ schema.prisma      # thiết kế CSDL (xem docs/DATABASE.md)
│  │  ├─ migrations/        # SQL migration
│  │  └─ seed.ts            # nạp nội dung từ shared/content.ts
│  └─ src/
│     ├─ app.ts             # khởi tạo Express (middleware, routes)
│     ├─ server.ts          # chạy local (app.listen)
│     ├─ config/env.ts
│     ├─ lib/               # prisma client, HttpError
│     ├─ middlewares/       # error handler, requireAdmin
│     ├─ routes/            # khai báo endpoint
│     ├─ controllers/       # nhận request → gọi service → trả response
│     ├─ services/          # nghiệp vụ + truy vấn DB
│     └─ validators/        # zod schema
├─ frontend/                # FE – React + Vite
│  ├─ index.html
│  └─ src/
│     ├─ api/client.ts      # fetch wrapper
│     ├─ hooks/useSiteContent.ts
│     ├─ components/        # Nav, Hero, NetworkCanvas (hiệu ứng mạng), Tabs, ...
│     ├─ sections/          # About, Courses, Media, Elearning, Events, Contact
│     ├─ lib/format.ts
│     └─ styles/global.css  # toàn bộ CSS của thiết kế gốc
├─ shared/                  # dùng chung FE + BE
│  ├─ types.ts              # DTO / kiểu dữ liệu API
│  └─ content.ts            # nội dung gốc: seed DB + fallback
├─ docs/DATABASE.md         # phân tích CSDL, ERD
├─ vercel.json
└─ package.json             # npm workspaces
```

### Luồng dữ liệu

```
Trình duyệt ──► React (render ngay bằng shared/content.ts)
                  │
                  └─ GET /api/content ──► Express ──► Prisma ──► PostgreSQL
                                             └─ (chưa có DATABASE_URL) ──► shared/content.ts
```

- Trang hiển thị tức thì với nội dung đóng gói sẵn, rồi thay bằng dữ liệu từ API → không có màn hình loading,
  giao diện y hệt bản gốc kể cả khi API/DB gặp sự cố.
- Không cấu hình `DATABASE_URL` thì API vẫn chạy bằng nội dung tĩnh. Form demo phản hồi ngay như bản gốc:
  hiện thông báo "biểu mẫu đang thử nghiệm", xóa input, nội dung và checkbox, giữ ngành đã chọn; không gửi yêu cầu lên API.
  Khi nội dung được tải từ database, form chuyển sang lưu thật qua API.

## Hiệu ứng được giữ nguyên từ bản gốc

| Hiệu ứng | Vị trí |
|---|---|
| Canvas mạng lưới: node, ổ khóa có vòng sáng nhấp nháy, gói tin phát sáng chạy dọc liên kết; đổi màu theo theme; tự build lại khi resize; dừng khi tab ẩn | `components/NetworkCanvas.tsx` |
| Chấm "ping" lan tỏa ở badge trạng thái | `.dot` + `@keyframes ping` |
| Hero xuất hiện lần lượt (`rise`, delay 0.08/0.16/0.24s) | `.reveal .d1 .d2 .d3` |
| Nav dính, nền mờ `backdrop-filter: blur(14px)`, menu mobile | `components/Nav.tsx` |
| Hover: nút nhấc 1px, thẻ khóa học nhấc 3px + viền xanh, sự kiện đổi viền | `global.css` |
| Tabs Nhóm 1/2/3, IARIS Media (lọc 15 dịch vụ), Sự kiện | `components/Tabs.tsx` |
| Cổng học viên: chọn bài, đánh dấu hoàn thành, thanh tiến độ chạy (`transition: width .5s`) | `sections/Elearning.tsx` |
| Quiz 3 tình huống: đúng/sai, giải thích, kết quả, làm lại | `sections/Elearning.tsx` |
| Bấm CTA sự kiện → điền sẵn "Đăng ký: …" vào form | `App.tsx` → `sections/Contact.tsx` |
| Nền tối mặc định giống bản mẫu Claude; hỗ trợ token nền sáng, tôn trọng `prefers-reduced-motion` | `index.html`, `global.css` |

## API

| Method | Endpoint | Mô tả |
|---|---|---|
| GET | `/api/health` | trạng thái, có DB hay không |
| GET | `/api/content` | toàn bộ nội dung trang chủ (1 request) |
| GET | `/api/laws` · `/api/courses` · `/api/tiers` · `/api/sectors` | từng phần nội dung |
| GET | `/api/media?group=M1\|M2\|M3` | dịch vụ IARIS Media |
| GET | `/api/events?status=up\|web\|past` | sự kiện |
| GET | `/api/elearning` | bài học + quiz B6 |
| POST | `/api/leads` | gửi yêu cầu tư vấn (validate bằng zod, có honeypot chống bot) |
| POST | `/api/quiz-attempts` | lưu kết quả quiz (server tự chấm điểm) |
| GET | `/api/leads?status=&take=&skip=` | **admin** – danh sách lead |
| PATCH | `/api/leads/:id` | **admin** – cập nhật `status`, `note` |

Endpoint admin cần header `Authorization: Bearer <ADMIN_TOKEN>`.

## Chạy local

Yêu cầu: Node.js ≥ 20.19.

```bash
npm install
```

```bash
cp .env.example backend/.env
```

Sửa `DATABASE_URL` trong `backend/.env` (hoặc để trống để chạy bằng nội dung tĩnh). Có DB thì tạo bảng và nạp dữ liệu:

```bash
npm run db:deploy
```

```bash
npm run db:seed
```

Chạy cả FE (http://localhost:5173) và BE (http://localhost:4000):

```bash
npm run dev
```

PostgreSQL local nhanh bằng Docker:

```bash
docker run -d --name iaris-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=iaris -p 5432:5432 postgres:16-alpine
```

Các lệnh khác: `npm run build`, `npm run typecheck`, `npm run db:migrate` (tạo migration mới khi sửa schema),
`npm run db:studio` (xem/sửa dữ liệu bằng giao diện).

## Đưa lên GitHub

```bash
git remote add origin https://github.com/<user>/iaris-web.git
```

```bash
git push -u origin main
```

## Deploy lên Vercel

1. **Tạo database**: Vercel → Storage → Marketplace → **Neon** (Postgres) → Connect vào project.
   Vercel tự thêm biến `DATABASE_URL`. (Có thể dùng Supabase/Neon ngoài, chỉ cần chuỗi kết nối.)
2. **Import project**: Vercel → Add New → Project → chọn repo GitHub.
   - Root Directory: để mặc định (thư mục gốc repo)
   - Framework Preset: **Other** (mọi thiết lập build đã có trong `vercel.json`)
3. **Environment Variables**: `DATABASE_URL`, `ADMIN_TOKEN` (chuỗi ngẫu nhiên dài).
4. **Tạo bảng + nạp dữ liệu** (chạy một lần từ máy, dùng chuỗi kết nối production):

   ```bash
   DATABASE_URL="postgresql://..." npm run db:deploy
   ```

   ```bash
   DATABASE_URL="postgresql://..." npm run db:seed
   ```

5. Deploy. Mỗi lần push lên `main` Vercel tự build lại; Pull Request có Preview URL riêng.

Kiểm tra sau deploy: mở `https://<domain>/api/health` → `"database": "configured"`.

> Muốn tách FE và BE thành 2 project Vercel/hosting khác nhau: đặt `VITE_API_URL` (frontend) trỏ tới domain API
> và thêm domain frontend vào `CORS_ORIGINS` (backend).

## Ghi chú

- Hotline, email, địa chỉ trong mục Liên hệ vẫn là `[cập nhật]` như bản gốc – sửa trong `frontend/src/sections/Contact.tsx`.
- Sửa nội dung (khóa học, sự kiện, dịch vụ…): sửa `shared/content.ts` rồi chạy lại `npm run db:seed`,
  hoặc sửa trực tiếp trong DB bằng `npm run db:studio`.

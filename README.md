# IARIS Cyber & Data

Repo chính: https://github.com/MPGranji/iaris-web.
Website và admin dùng chung PostgreSQL, triển khai thành hai project Vercel:

| Ứng dụng | URL | Build Command | Output Directory |
|---|---|---|---|
| Website | https://iaris-web.vercel.app/ | npm run build | frontend/dist |
| Admin | https://iaris-admin.vercel.app/ | npm run db:generate && npm run build:admin | admin/dist |

Hai project dùng cùng root repo, mỗi domain có API riêng để sử dụng cookie đăng nhập.
Database Neon Free **iaris-main-db** ở Singapore tách biệt database sandbox.

## Chức năng

- Admin quản lý nội dung bản nháp, xuất bản website, tài khoản và quyền hạn.
- Form tư vấn lưu vào database; thông báo chủ và xác nhận khách được gửi qua email, có lịch sử gửi.
- Chuông admin kiểm tra yêu cầu mới mỗi 10 giây khi tab đang hiển thị và khi quay lại tab.
- Bản demo bật DEMO_ADMIN_LOGIN=true: đăng nhập **admin / admin**, có gợi ý ở màn hình đăng nhập.
  Sau khi gửi form thành công, website hiển thị link mở đúng hồ sơ trong admin.
- PUBLIC_SITE_URL=https://iaris-web.vercel.app và ADMIN_APP_URL=https://iaris-admin.vercel.app
  xác định liên kết giữa hai ứng dụng và trong email.

Email gửi/nhận hiện dùng granjihas@gmail.com; SMTP password lưu dưới dạng Secret trên cả hai project.
Xem [cấu hình email](docs/CONSULTATION-EMAIL.md), [admin](docs/ADMIN.md),
[thiết kế database được phát triển trong sandbox](docs/SANDBOX-DATABASE.md).
Tắt DEMO_ADMIN_LOGIN để tắt tài khoản công khai và link admin sau khi gửi form.

## Chạy trên máy

Node.js >= 20.19 và PostgreSQL 18 (hoặc cấu hình PG_BIN).

~~~powershell
npm ci
npm run local:setup
npm run dev:all
~~~

Website: http://127.0.0.1:5175, admin: http://127.0.0.1:5176, API: http://127.0.0.1:4001.
Database local riêng: 127.0.0.1:5441/iaris_dev; không dùng cluster sandbox cổng 5440.
Thông tin đăng nhập local nằm trong .local/admin-access.txt. Local mặc định chỉ lưu email xem trước.
Seed chỉ nạp nội dung khi database trống và không ghi đè nội dung admin đã chỉnh.

## Kiểm tra

~~~powershell
npm run typecheck
npm run test:admin
npm run test:frontend
npm run test:integration
npm run test:ui
npm run build:admin
npm run build
~~~

Integration test chỉ chạy trên database local cổng 5441, dùng schema ngẫu nhiên riêng rồi dọn schema đó.

## Triển khai

Thiết lập Build Command / Output Directory theo bảng trên, Framework Other, Node 24.x.
Biến database và email phải đặt trên cả hai project; không đưa file môi trường hoặc .local/ lên Git/Vercel.
Chạy migration và seed một lần với database đã xác minh đúng môi trường trước khi deploy.

~~~powershell
npx vercel deploy --prod --project iaris-web --scope vpqcuong-5136
npx vercel deploy --prod --project iaris-admin --scope vpqcuong-5136
~~~

Cả hai project đã liên kết repo GitHub chính; push main sẽ tự build website và admin.

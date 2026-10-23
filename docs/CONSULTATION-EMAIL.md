# Form tư vấn, admin và email

Không có tài khoản học viên trong luồng này. Người liên hệ chỉ cần điền form.

1. Form lưu yêu cầu và thư thông báo cho chủ website vào PostgreSQL trong cùng transaction.
2. Thư `OWNER_NOTICE` gửi đến `CONSULTATION_TO`; bấm Reply sẽ trả lời địa chỉ khách điền trong form.
3. Không gửi thư xác nhận tự động tới email khách. Lịch sử thư xác nhận cũ được giữ lại, không gửi lại.
4. Admin xem hồ sơ, ghi chú nội bộ, trạng thái từng thư, nội dung xem trước và thử gửi lại khi lỗi.
5. Nút **Soạn email trả lời** mở ứng dụng email của nhân sự. Thư khách trả lời về hộp thư người phụ trách,
   chưa tự đồng bộ nội dung trả lời vào admin.

## Cấu hình linh hoạt

Chỉnh `backend/.env`, tham khảo `.env.example`. File thật được Git bỏ qua.

```dotenv
MAIL_MODE="preview"
CONSULTATION_TO="your-address@gmail.com"
MAIL_FROM="your-address@gmail.com"
MAIL_REPLY_TO="your-address@gmail.com"
ADMIN_APP_URL="http://127.0.0.1:5176"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER="your-address@gmail.com"
SMTP_PASSWORD=""
```

- `CONSULTATION_TO`: email nhận yêu cầu mới, có thể khác email gửi.
- `MAIL_FROM`: email gửi, phải được máy chủ SMTP cho phép.
- `MAIL_REPLY_TO`: email nhận trả lời của khách.
- `ADMIN_APP_URL`: link đúng của admin, đổi khi deploy.
- `MAIL_MODE=preview`: chỉ tạo bản xem trước trong database; không gửi ra ngoài.
- `MAIL_MODE=smtp`: gửi thật qua máy chủ đã cấu hình. Thiếu cấu hình thì vẫn lưu lead và ghi lỗi email trong admin.
- Có thể đổi sang mail tên miền bằng cách đổi các trường `SMTP_*` và địa chỉ mail; không sửa source code.

## Bật Gmail gửi thật

Tạo mật khẩu ứng dụng theo [hướng dẫn Google](https://support.google.com/accounts/answer/185833),
điền vào `SMTP_PASSWORD` trên máy, đổi `MAIL_MODE="smtp"`, rồi khởi động lại API.
Không gửi mật khẩu trong chat hoặc commit lên Git. Không dùng mật khẩu đăng nhập Gmail thông thường.

```powershell
npm run dev:all
```

Gửi một form mới để kiểm tra hộp thư chủ website. Có thể cần kiểm tra mục spam.
Thư PREVIEW cũ không tự chuyển thành thư gửi thật khi đổi mode, tránh vô tình gửi dữ liệu thử nghiệm.

## Bản Vercel chính

Website `iaris-web` và admin `iaris-admin` dùng chung database và cùng cấu hình mail.
Địa chỉ gửi/nhận thử nghiệm hiện là `granjihas@gmail.com`, SMTP Gmail cổng 465/TLS.
Các biến `MAIL_MODE`, `CONSULTATION_TO`, `MAIL_FROM`, `MAIL_REPLY_TO`, `SMTP_HOST`, `SMTP_PORT`,
`SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` được đặt trong môi trường Production của **cả hai project**.
`SMTP_PASSWORD` phải lưu dưới dạng Secret; không ghi giá trị vào tài liệu hoặc Git.
Sau khi đổi cấu hình cần deploy lại cả hai project. Xem lệnh tại [README.md](../README.md).
API có thời gian tối đa 30 giây để lưu yêu cầu và chờ SMTP trả lời.

## Xử lý lỗi và giới hạn

- Yêu cầu đã lưu không mất khi SMTP lỗi. Không báo form thất bại chỉ vì thư thông báo chưa gửi được.
- Mã gửi UUID được giữ khi thử lại cùng nội dung; không tạo trùng lead hoặc hai thư thông báo sau lỗi mạng.
- Giới hạn 3 yêu cầu cho cùng email trong 15 phút để hạn chế spam yêu cầu.
- Lịch sử gửi có lease trong database, chặn hai phiên gửi lại đồng thời; thư SENT/PREVIEW không được gửi lại.
- SMTP xác nhận tiếp nhận không đồng nghĩa thư chắc chắn vào inbox. Nếu kết nối mất ngay sau khi máy chủ nhận thư,
  cần kiểm tra hộp thư trước khi thử lại; không thể bảo đảm exactly-once qua SMTP.
- Không có cron/worker được cấu hình. Nếu tiến trình dừng giữa chừng, nhân sự mở lịch sử email trong admin để thử lại;
  trạng thái PROCESSING chỉ được nhận lại sau 60 giây.
- Test dùng preview, sender giả hoặc máy nhận SMTP chỉ mở trên loopback; không lấy thông tin SMTP thật trong `.env` để gửi thư kiểm thử.

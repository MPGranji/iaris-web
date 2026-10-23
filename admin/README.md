# IARIS Admin

Frontend quản trị riêng dùng React 19 + TypeScript + Vite, gọi `/api/admin` trên Express và PostgreSQL.

Từ thư mục gốc: `npm run local:setup` rồi `npm run dev:all`.
Admin chạy tại http://127.0.0.1:5176/, website tại http://127.0.0.1:5175/.
Tài khoản đầu tiên được ghi vào `.local/admin-access.txt` (gitignored).

- `src/store.ts`: dữ liệu API và phiên đăng nhập; không lưu hồ sơ hay token vào localStorage.
- `src/pages/`: danh mục, biên tập website, tư vấn, kết quả quiz, xuất bản và tài khoản.
- `../shared/admin-schema.ts`: trường biểu mẫu và validation dùng chung FE/BE.
- `../backend/src/routes/admin.ts`: API quản trị có đăng nhập và kiểm tra quyền tại server.
- `../backend/prisma/schema.prisma`: schema nghiệp vụ, tài khoản, phiên, bản xuất bản và nhật ký thao tác.

Lưu nội dung tạo bản nháp. Xuất bản tạo snapshot công khai để website đọc; snapshot không chứa hồ sơ tư vấn, tài khoản hay ghi chú nội bộ.
Trạng thái/ghi chú tư vấn và thông tin tài khoản có hiệu lực sau khi lưu, không cần xuất bản.

| Vai trò | Biên tập/xuất bản | Hồ sơ tư vấn | Tài khoản |
|---|---|---|---|
| Quản trị viên | Có | Có | Có |
| Biên tập viên | Có | Không | Không |
| Tư vấn viên | Không | Có | Không |

Bấm **Làm mới** để nhận yêu cầu mới hoặc dữ liệu sửa ở phiên khác.
Nếu có xung đột phiên sửa, API trả 409; giữ nội dung cần thiết, rời biểu mẫu và tải lại trước khi sửa tiếp.
Màn hình hiện lấy 500 yêu cầu tư vấn mới nhất, 100 lượt quiz và 30 bản xuất bản mới nhất.
Hồ sơ tư vấn có lịch sử thông báo cho chủ website và thử gửi lại khi lỗi. Không tự gửi email cho khách.
Chế độ preview không gửi ra ngoài; gửi thật được cấu hình qua `backend/.env`.
Xem [luồng email tư vấn](../docs/CONSULTATION-EMAIL.md).
Chưa có khôi phục mật khẩu qua email, gửi thư mời, MFA hay chức năng LMS cho học viên.
Xem hướng dẫn đầy đủ tại [README.md](../README.md).

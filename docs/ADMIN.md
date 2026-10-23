# Cập nhật IARIS 23/10/2026

Admin trong repo chính đã gọi API/database, có đăng nhập và quyền theo vai trò; website đọc nội dung đã xuất bản.
Xem [SANDBOX-DATABASE.md](SANDBOX-DATABASE.md) và [../README.md](../README.md) cho trạng thái triển khai hiện tại.
Tài liệu đề xuất ngày 22/10 bên dưới được giữ lại để tham khảo.

# Phân tích nhóm chức năng admin – IARIS Cyber & Data

Ngày ghi nhận: **22/10/2026**. Căn cứ: website hiện tại, schema Prisma, API và [phân tích database](./DATABASE.md).
Đây là đề xuất chức năng để phát triển sau, chưa phải đặc tả đã được duyệt hay chức năng đã triển khai.
Lần ghi nhận này chỉ tạo tài liệu, giữ nguyên FE, BE, schema và bản deploy.

## 1. Đã thiết kế database đến đâu?

Đã có schema PostgreSQL/Prisma gồm **10 bảng nghiệp vụ**, migration khởi tạo và seed từ nội dung mẫu:

- Nội dung website: `Law`, `Course`, `SectorTier`, `SectorProgram`, `MediaService`, `Event`.
- E-learning minh họa: `Lesson`, `QuizQuestion`, `QuizAttempt`.
- Yêu cầu tư vấn: `Lead`.

Đây là nền tảng cho website hiện tại, **chưa phải database đầy đủ cho admin hoặc hệ thống đào tạo thật**.
Chưa có model tài khoản quản trị, phân quyền, cấu hình nội dung chung, bản nháp hay lịch sử chỉnh sửa.
Bản Vercel đang dùng nội dung tĩnh theo lần kiểm tra ngày 22/10/2026; chưa dùng database để lưu dữ liệu.

BE mới có hai endpoint dành cho admin: `GET /api/leads` và `PATCH /api/leads/:id`, bảo vệ bằng
`ADMIN_TOKEN`. Chưa có giao diện admin, đăng nhập cá nhân, API sửa nội dung hoặc API báo cáo quiz.
Có bảng trong schema không đồng nghĩa đã có chức năng quản trị bảng đó.

## 2. Mục tiêu admin và giới hạn phạm vi

Mục tiêu ban đầu: người vận hành cập nhật nội dung để tạo ra website như bản hiện có và xử lý
yêu cầu khách gửi, trong khi giữ bố cục, thương hiệu và hiệu ứng đã đối chiếu với Claude.

Ba phần nghiệp vụ chính:

1. **Quản trị nội dung:** thông tin chung, đạo luật, khóa học, ngành, dịch vụ Media, sự kiện.
2. **Tiếp nhận và chăm sóc:** danh sách yêu cầu tư vấn, phân loại, trạng thái và ghi chú.
3. **Quản lý demo e-learning:** bài học, tình huống quiz và thống kê lượt làm khi có lưu thật.

Tài khoản học viên, bán khóa học, thanh toán, chứng nhận và cộng đồng thành viên là phần mở rộng.
Không suy ra rằng các hệ thống đó đã tồn tại chỉ vì trang có chữ Academy, E-learning hoặc Circle.

## 3. Các nhóm chức năng đề xuất

| Nhóm admin | Mục đích | Phần website/dữ liệu liên quan | Mức hỗ trợ hiện tại |
|---|---|---|---|
| 1. Tổng quan | Theo dõi nội dung và yêu cầu cần xử lý | Tổng hợp các bảng, đặc biệt `Lead`, `QuizAttempt` | Có dữ liệu thiết kế, chưa có API tổng hợp |
| 2. Nội dung và thông tin chung | Sửa các đoạn giới thiệu, liên hệ, footer, metadata | Các component và `frontend/index.html` | Chủ yếu đang viết cứng; chưa có bảng/API cấu hình |
| 3. Đạo luật | Quản lý danh sách luật ở hero | `Law` | Có schema, seed, API đọc; chưa có API quản trị |
| 4. Academy | Quản lý khóa nền tảng và chương trình theo ngành | `Course`, `SectorTier`, `SectorProgram` | Có schema, seed, API đọc; chưa có API quản trị |
| 5. IARIS Media | Quản lý danh mục dịch vụ/kênh và thẻ nổi bật | `MediaService` | Có schema, seed, API đọc; chưa có API quản trị |
| 6. Sự kiện và webinar | Quản lý nội dung sự kiện, phân loại và yêu cầu liên quan | `Event`, `Lead.eventId` | Có API đọc sự kiện và ghi lead; chưa có quản trị sự kiện |
| 7. E-learning và quiz | Quản lý bài học, câu hỏi và kết quả minh họa | `Lesson`, `QuizQuestion`, `QuizAttempt` | Có API đọc và chấm/lưu lượt làm; chưa có API quản trị/báo cáo |
| 8. Yêu cầu tư vấn | Tiếp nhận, xem chi tiết và xử lý lead | `Lead` | Có API danh sách, lọc trạng thái, phân trang và sửa trạng thái/ghi chú |
| 9. Tài khoản và phân quyền | Xác định ai được truy cập và thực hiện thao tác nào | Tài khoản quản trị, phiên đăng nhập, vai trò | Chưa có; token chung chỉ là bảo vệ API hiện tại |
| 10. Xuất bản và vận hành | Kiểm soát nội dung lên web, lịch sử và trạng thái hệ thống | Trạng thái xuất bản, audit log, cấu hình vận hành | Chưa có workflow/model riêng |

Các nhóm này là cách tổ chức menu và trách nhiệm, không bắt buộc mỗi nhóm tương ứng một bảng mới.

### 3.1. Tổng quan

- Số yêu cầu tư vấn mới, đang liên hệ, đủ điều kiện, đã chốt, không chốt và spam.
- Danh sách yêu cầu mới nhất; lọc khoảng thời gian, ngành, nhóm quan tâm và sự kiện nếu đã có API hỗ trợ.
- Tổng số khóa nền tảng, chương trình ngành, dịch vụ Media, sự kiện và bài học đang hiển thị.
- Khi có dữ liệu thật: số lượt làm quiz, điểm trung bình, tỷ lệ đúng từng tình huống.
- Trạng thái nguồn nội dung: tĩnh/database, lần xuất bản gần nhất, các mục còn thiếu như hotline/email.

Không hiển thị lượt xem, doanh thu hay tỷ lệ chuyển đổi khách truy cập thành lead khi chưa có nguồn đo.
`QuizAttempt` hiện chỉ đếm lượt làm, không xác định số người học duy nhất. `WON` chưa có giá trị hợp đồng,
nên không suy ra doanh thu từ trạng thái này.

### 3.2. Nội dung và thông tin chung

| Khu vực | Nội dung người quản trị có thể cần sửa | Nguồn hiện tại |
|---|---|---|
| Hero | Badge, tiêu đề, mô tả, nhãn CTA, dòng cuối thẻ luật | `Hero.tsx` |
| Về IARIS | Giới thiệu, ý nghĩa R/I/S, sứ mệnh, tầm nhìn, giá trị, mô hình vận hành và giai đoạn phát triển | `About.tsx` |
| Đối tác | Tên đối tác, thứ tự; logo/liên kết nếu bổ sung sau | `About.tsx` |
| Giới thiệu Academy | Tiêu đề, lý do chọn, hình thức học, nội dung chứng nhận | `Courses.tsx` |
| Giới thiệu Media | Mô tả và 7 nguyên tắc biên tập | `Media.tsx` |
| Giới thiệu E-learning/Sự kiện | Mô tả và thông tin ra mắt | `Elearning.tsx`, `Events.tsx` |
| Liên hệ | Hotline, email, địa chỉ, pháp nhân, nội dung hướng dẫn | `Contact.tsx` |
| Footer | Tên đơn vị, giới thiệu và lưu ý về nội dung đào tạo | `Footer.tsx` |
| Metadata | Tiêu đề trang, mô tả SEO; ảnh chia sẻ nếu bổ sung | `frontend/index.html` |

Cần bổ sung cấu trúc như `SiteSettings`/`PageContent` có trường rõ ràng và API tương ứng.
Sau này phải thay các điểm đọc nội dung viết cứng trong FE bằng dữ liệu cấu hình; chỉ thêm trang admin
và bảng DB sẽ chưa làm các đoạn này đổi theo.

Cho phép sửa nội dung theo vị trí có sẵn; chưa cần trình kéo thả bố cục, sửa CSS, nhập JavaScript
hay thay hiệu ứng canvas. Các số ở dải thống kê tiếp tục tính từ dữ liệu, không nhập tay.
Nhãn "Đang hiệu lực" hiện là nội dung cố định, chưa tự tính từ ngày của từng luật.

### 3.3. Đạo luật

- Danh sách, thêm/sửa: tên luật, chi tiết/số hiệu, ngày hiệu lực, thứ tự hiển thị.
- Xem trước thẻ luật ở hero; ẩn/lưu trữ bản không còn dùng khi có cơ chế xuất bản.
- Nếu cần quy trình kiểm chứng: bổ sung nguồn tham chiếu, người kiểm tra và ngày kiểm tra.

`Law` hiện có các trường hiển thị và timestamps; chưa có URL nguồn, trạng thái xuất bản hay người duyệt.
Không mặc định phải luôn có đúng 4 luật: danh sách có thể thay đổi, nhưng cần rà các câu chữ đang ghi "cả bốn".

### 3.4. Academy: khóa nền tảng và chương trình ngành

**Khóa nền tảng:** quản lý mã B1–B6, tên, thông điệp, thời lượng, đối tượng, kết quả đầu ra và thứ tự.
Mã khóa cần ổn định; B6 đang được dùng để tìm bài học/quiz trong code, nên đổi mã có tác động vượt ngoài nội dung.

**Nhóm ngành:** quản lý nhãn ngắn, nhãn đầy đủ, phần giới thiệu và mức học sâu 1–3.
Giữ 3 nhóm là phạm vi ban đầu; việc thêm nhóm mới cần rà bố cục và câu chữ của website.

**Chương trình ngành:** thêm/sửa tên, nhóm, đối tượng, trọng tâm, chuẩn tham chiếu, kỳ khai giảng và thứ tự.
Danh sách này đồng thời tạo các lựa chọn "Ngành" trong form; thay đổi phải xem xét lead cũ.
Khi thiết kế thao tác xóa/lưu trữ, cần giữ lịch sử: schema hiện cascade xóa toàn bộ lượt quiz nếu xóa khóa học,
và đổi tên ngành có thể tạo dòng mới khi chạy seed theo khóa tên.

Chưa có lớp khai giảng cụ thể, số chỗ, học phí, giảng viên, đăng ký học hoặc quan hệ nối một chương trình
ngành với các khóa nền tảng. Nếu cần các nghiệp vụ này phải mở rộng schema, không chỉ thêm ô nhập ở admin.

### 3.5. IARIS Media

- Quản lý tên dịch vụ/kênh, thông điệp, danh sách lợi ích, mô tả hình thức/tần suất, thứ tự và cờ nổi bật.
- Chọn nhóm M1/M2/M3; xem trước kết quả ở tab "Tất cả" và tab nhóm.
- Khi cần theo dõi báo giá theo dịch vụ: bổ sung liên kết dịch vụ với yêu cầu tư vấn.

Đây là **danh mục giới thiệu dịch vụ**, chưa phải CMS xuất bản bản tin, podcast hoặc video.
Nút "Nhận báo giá" hiện chỉ dẫn đến form chung, chưa gắn `mediaServiceId` hoặc tự điền tên dịch vụ.
Schema cũng chưa có bài viết, tập podcast, tệp video, lịch xuất bản, đơn báo giá hay hợp đồng tài trợ.

### 3.6. Sự kiện và webinar

- Quản lý slug, tên, tóm tắt, nhãn ngày/kỳ, tags, nhãn nút và thứ tự.
- Chọn tab hiển thị bằng `status`; chọn loại/màu nhãn bằng `kind`. Hai trường có mục đích khác nhau.
- Khi đã chốt lịch: nhập ngày giờ thật và múi giờ; thiết kế thêm thời gian kết thúc nếu cần quản lý vòng đời.
- Xem các yêu cầu tư vấn bắt nguồn từ sự kiện qua `Lead.eventId`.
- Sau này có thể bổ sung địa điểm, diễn giả, link webinar, giới hạn chỗ, xác nhận tham dự và gửi nhắc lịch.

`startsAt` đã có nhưng hiện chưa được seed gán, chưa điều khiển việc tự chuyển sự kiện sang "Đã diễn ra".
Đặc biệt, nút "Xem tóm tắt" của sự kiện cũ hiện vẫn dẫn về form và điền sẵn nội dung đăng ký theo bản mẫu.
Admin không nên ngụ ý đã có trang recap, danh sách người tham dự hay hệ thống vé.

Muốn đổi hành vi nút theo loại sự kiện cần thống nhất trước, bổ sung loại đích/link và cập nhật FE sau này.

### 3.7. E-learning, quiz và thống kê

**Bài học:** quản lý tên, mô tả, thời lượng, vị trí; xem trước cổng B6.
`Lesson` chưa có video, tài liệu đính kèm hay điều kiện hoàn thành thực tế.

**Quiz:** quản lý tình huống, nội dung minh họa, các lựa chọn, đáp án đúng, giải thích và thứ tự.
Validate đáp án đúng thuộc danh sách; không cho đổi thứ tự câu/đáp án mà diễn giải sai lượt làm cũ.

**Kết quả:** danh sách lượt làm theo thời gian/khóa, phân bố điểm và tỷ lệ đúng theo câu khi có dữ liệu
và phiên bản bộ đề đủ để tính. Cần API đọc báo cáo; API hiện mới chấm và ghi lượt làm.

Trước khi quản lý quiz thật, cần phiên bản bộ đề hoặc snapshot câu hỏi/đáp án của mỗi lượt.
API công khai hiện trả đáp án đúng, phù hợp demo; không dùng nguyên trạng để thi cấp chứng nhận.
Không gọi tiến độ minh họa 2/6 bài là dữ liệu học viên: nó chỉ nằm ở React state và mất khi tải lại.

### 3.8. Yêu cầu tư vấn

Đây là nhóm gần với vận hành thực tế nhất vì BE đã có một phần API.

- Danh sách phân trang, lọc trạng thái; xem họ tên, doanh nghiệp, chức vụ, email, điện thoại, ngành,
  nhóm quan tâm, nội dung, sự kiện nguồn và thời điểm gửi.
- Chi tiết yêu cầu, ghi chú nội bộ, cập nhật trạng thái và đánh dấu spam.
- Quy trình dự kiến: `NEW → CONTACTED → QUALIFIED → WON/LOST`; `SPAM` cho yêu cầu không phù hợp.
- Sau này: tìm kiếm tên/email/doanh nghiệp, lọc thời gian/ngành/sự kiện, giao người phụ trách,
  lịch nhắc liên hệ, thông báo có yêu cầu mới, xuất dữ liệu theo quyền và lịch sử xử lý.

API hiện chỉ lọc `status`, phân trang `take/skip`, cập nhật `status/note`; chưa có tìm kiếm, phân công,
nhắc lịch, gửi email, xuất file hay lịch sử thay đổi. Trạng thái được phép chuyển trực tiếp, chưa có quy tắc pipeline.
`note` là một trường ghi chú hiện tại, không phải chuỗi trao đổi hoặc nhật ký nhiều lần liên hệ.

"Đăng ký sự kiện" hiện vẫn là một lead, chưa phải đăng ký tham dự đã xác nhận.
"Đăng ký B6" cũng chưa phải enrollment hoặc giao dịch mua khóa học.

### 3.9. Tài khoản và phân quyền

Các vai trò sau là đề xuất để chia trách nhiệm khi có nhiều người sử dụng:

| Vai trò | Quyền dự kiến |
|---|---|
| Quản trị viên | Quản lý tài khoản, cấu hình, quyền xuất bản và toàn bộ nội dung/lead |
| Biên tập viên | Soạn/sửa nội dung website, khóa học, dịch vụ, sự kiện và bài học; không đọc dữ liệu liên hệ khách nếu không được cấp thêm |
| Tư vấn viên | Đọc và xử lý lead theo phạm vi được giao; không sửa nội dung website |

Nếu chỉ có một người vận hành, có thể bắt đầu bằng vai trò quản trị viên và phân quyền thêm khi có nhu cầu.
Nếu áp dụng quy trình duyệt chuyên gia và luật sư ngay trong hệ thống, cần xác định thêm người duyệt,
phạm vi và bước phê duyệt; chưa mặc định xây một workflow nhiều tầng.

Cần đăng nhập, đăng xuất, quản lý phiên, khóa tài khoản và kiểm tra quyền ở BE.
Không đưa `ADMIN_TOKEN` hiện tại vào JavaScript của trang admin để thay cho đăng nhập và phân quyền.
Schema tài khoản/phiên/vai trò chưa có; lựa chọn cơ chế xác thực cần được chốt ở đợt triển khai.

### 3.10. Xuất bản và vận hành

- Nội dung: xem trước, lưu và xuất bản có chủ đích; ẩn/lưu trữ thay cho xóa cứng khi còn dữ liệu tham chiếu.
- Nếu cần bản nháp: đề xuất `DRAFT/PUBLISHED/ARCHIVED`, cùng người sửa, người xuất bản và thời điểm.
- Nếu cần sửa bản đã đăng mà web vẫn giữ bản cũ đến khi duyệt, phải có revision/bản nháp tách khỏi
  dữ liệu đã xuất bản; chỉ thêm một cột `status` chưa giải quyết được tình huống này.
- Audit log cho đổi nội dung, đổi trạng thái lead, xuất dữ liệu và thay quyền; có ai làm, lúc nào, đối tượng nào.
- Theo dõi kết nối DB thực tế, migration, nguồn nội dung và lỗi lưu form; không dùng riêng `/api/health`
  hiện tại làm bằng chứng kết nối DB thành công.
- Secrets, backup/khôi phục và deploy ban đầu có thể quản lý qua công cụ hạ tầng; không cần xây nút chạy
  migration/seed hoặc cho chỉnh chuỗi kết nối trong giao diện admin.

**Điểm vận hành cần giữ:** seed hiện có thể ghi đè nội dung và tạo lại ID của một số bảng.
Khi có CMS, phải chốt nguồn dữ liệu chuẩn và quy trình seed/import; không chạy seed lại để "đồng bộ"
mà vô tình mất nội dung người biên tập đã sửa.

## 4. Quy trình điển hình

### Cập nhật nội dung website

Chọn nhóm nội dung → sửa các trường → kiểm tra hợp lệ → xem trước → lưu/xuất bản theo quyền →
website đọc dữ liệu đã xuất bản → ghi lịch sử thao tác.

Hiện tại mới có bước đọc dữ liệu DB. Giao diện soạn nội dung, API ghi, preview và workflow xuất bản đều cần phát triển.

### Xử lý yêu cầu tư vấn

Khách gửi form khi đã bật lưu thật → tạo `Lead` trạng thái `NEW` → người tư vấn xem chi tiết →
cập nhật trạng thái/ghi chú → theo dõi đến khi chốt, không chốt hoặc spam.

Thông báo, phân công và nhắc liên hệ là phần bổ sung. Không tự gửi email cho khách chỉ vì có địa chỉ email trong lead.

### Chuyển từ demo sang lưu thật

Chuẩn bị DB và nội dung đầy đủ → kiểm tra quyền quản trị và các luồng ghi → quyết định bật nhận dữ liệu thật →
kiểm tra form và quiz trên môi trường phù hợp → mới đưa vào sử dụng.

Code hiện tự bật lưu khi nhận `content.source === 'database'`; chưa có công tắc riêng trong admin.
Nếu cần điều khiển độc lập, phải bổ sung cấu hình/API và thay điểm đọc ở FE trong đợt phát triển sau.

## 5. Khoảng trống database/API cần bổ sung

| Nhu cầu | Tận dụng hiện có | Còn thiếu |
|---|---|---|
| Sửa nội dung danh mục | 8 model nội dung: luật, khóa, nhóm, ngành, Media, sự kiện, bài học, câu hỏi | API quản trị, validate trường nội dung, quyền ghi |
| Sửa nội dung chung | Các đoạn text trong component | Cấu trúc `SiteSettings`/`PageContent`, DTO và binding FE |
| Ẩn/lưu trữ/xuất bản | ID, một số timestamps và thứ tự | Trạng thái xuất bản, revision nếu cần, người thực hiện; API công khai lọc đúng nội dung |
| Quản trị lead | `Lead`, hai endpoint admin | Tìm kiếm/lọc nâng cao; người phụ trách, nhắc lịch và lịch sử nếu đưa vào phạm vi |
| Theo dõi nhu cầu theo khóa/dịch vụ | `interests`, ngành và sự kiện nguồn | Quan hệ cụ thể đến `Course`/`MediaService` khi cần; hiện chưa có |
| Báo cáo quiz đáng tin cậy | `QuizAttempt` | API đọc/tổng hợp, phiên bản đề hoặc snapshot; nhận diện người làm nếu cần |
| Tài khoản quản trị | Middleware token chung | Tài khoản hoặc tích hợp nhà cung cấp xác thực, phiên và quyền |
| Lịch sử quản trị | `updatedAt` ở một số bảng | `AuditLog` hoặc cấu trúc tương đương; trường người sửa |
| Tài liệu/hình ảnh upload | Favicon/font và nội dung hiện tại | Chỉ bổ sung lưu trữ file/`Asset` nếu đưa upload vào phạm vi; chưa cần cho danh mục text hiện có |

Tên model mới trong bảng là gợi ý, chưa phải quyết định schema. Chi tiết khóa ngoại, retention và migration
sẽ thiết kế khi chốt phạm vi triển khai.

## 6. Thứ tự phát triển đề xuất

| Đợt | Kết quả cần đạt |
|---|---|
| 1. Nền tảng admin | Chuẩn bị DB, đăng nhập/quyền quản trị, xử lý lead bằng API hiện có và ghi lịch sử thao tác thiết yếu |
| 2. Quản lý nội dung chính | CRUD luật, khóa học, ngành, Media, sự kiện; sắp xếp, xem trước, quy tắc lưu/xuất bản và bảo toàn dữ liệu liên quan |
| 3. Quản trị toàn bộ chữ trên trang | Nội dung chung, liên hệ, footer/metadata; bổ sung nơi lưu và binding FE, giữ layout/hiệu ứng |
| 4. E-learning demo và báo cáo | Quản lý bài học/câu hỏi, phiên bản quiz và thống kê có cơ sở |
| 5. Mở rộng khi có nghiệp vụ thật | Lớp học, enrollment, tài khoản học viên, tiến độ thật, thanh toán/chứng nhận, bản tin hoặc sản xuất nội dung Media |

Đợt 1–4 đủ để quản trị website giới thiệu và phần demo hiện tại. Đợt 5 là sản phẩm mở rộng,
không phải điều kiện để tái tạo website Claude.

## 7. Các quyết định cần chốt khi bắt đầu làm admin

1. Một hay nhiều người vận hành; ai được sửa nội dung, đọc lead và xuất bản?
2. Cần quản trị toàn bộ chữ trên trang ngay từ đầu, hay ưu tiên danh mục và yêu cầu tư vấn?
3. Lưu là lên web ngay, hay cần bản nháp/duyệt trước khi xuất bản?
4. E-learning tiếp tục minh họa hay bắt đầu đào tạo và đánh giá người học thật?
5. Sự kiện chỉ thu nhu cầu qua form hay có đăng ký, xác nhận và quản lý người tham dự riêng?
6. Khi nào nhận dữ liệu khách thật, cách thông báo/tiếp nhận và chính sách lưu/xóa do đơn vị vận hành quy định?

Các câu hỏi này dùng cho đợt triển khai tương lai; không cản trở việc lưu bản phân tích hiện tại.

## 8. Tài liệu và mã nguồn đối chiếu

- [Database hiện tại, ERD và giới hạn](./DATABASE.md).
- [Schema Prisma](../backend/prisma/schema.prisma).
- [Các endpoint hiện có](../backend/src/routes/index.ts).
- [Service xử lý lead](../backend/src/services/lead.service.ts).
- [Service nội dung](../backend/src/services/content.service.ts).
- [Service quiz](../backend/src/services/quiz.service.ts).
- [Các section của website](../frontend/src/sections).
- [Điểm chọn demo/lưu thật](../frontend/src/App.tsx).

Không có thay đổi FE/BE, migration, seed, biến môi trường, push hoặc deploy trong lần ghi nhận này.

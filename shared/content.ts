// Canonical site content.
// - backend/prisma/seed.ts loads it into PostgreSQL
// - the API serves it directly when DATABASE_URL is not configured
// - the frontend renders it immediately (first paint) and while the API is unreachable
import type { SiteContent } from './types';

export const staticContent: SiteContent = {
  source: 'static',

  laws: [
    { effectiveDate: '2025-07-01', name: 'Luật Dữ liệu', detail: '60/2024/QH15 · khung quản lý, bảo vệ dữ liệu số' },
    { effectiveDate: '2026-01-01', name: 'Luật Bảo vệ dữ liệu cá nhân', detail: '91/2025/QH15 · cùng Nghị định 356/2025' },
    { effectiveDate: '2026-03-01', name: 'Luật Trí tuệ nhân tạo', detail: 'Phân loại hệ thống AI theo mức rủi ro' },
    { effectiveDate: '2026-07-01', name: 'Luật An ninh mạng 2025', detail: '116/2025/QH15 · nghĩa vụ chủ hệ thống thông tin' },
  ],

  courses: [
    {
      code: 'B1',
      title: 'Cyber cho Hội đồng quản trị và CEO',
      tagline: 'Lãnh đạo an ninh mạng không cần biết kỹ thuật, cần biết hỏi đúng câu hỏi.',
      duration: '1 ngày',
      audience: 'HĐQT, CEO, ban điều hành',
      outcomes:
        'Trách nhiệm lãnh đạo theo luật mới; 10 câu hỏi HĐQT cần đặt cho đội CNTT; cách đọc báo cáo rủi ro mạng; kế hoạch hành động 90 ngày.',
    },
    {
      code: 'B2',
      title: 'Chuyên viên Bảo vệ dữ liệu cá nhân (DPO)',
      tagline: 'Từ quy định đến quy trình vận hành theo Luật BVDLCN và Nghị định 356/2025.',
      duration: '6 buổi · 60% thực hành',
      audience: 'Phụ trách dữ liệu, pháp chế, tuân thủ, nhân sự, CNTT',
      outcomes:
        'Bộ hồ sơ mẫu (đánh giá tác động, đồng ý, thông báo vi phạm); quy trình xử lý yêu cầu chủ thể dữ liệu; kế hoạch tuân thủ. Đồng triển khai cùng VnDSS.',
    },
    {
      code: 'B3',
      title: 'Tuân thủ Luật An ninh mạng 2025 và Luật Dữ liệu',
      tagline: 'Nắm trọn nghĩa vụ mới có hiệu lực từ 01/07/2026.',
      duration: '1 ngày',
      audience: 'CISO, giám đốc CNTT, pháp chế, chủ hệ thống thông tin',
      outcomes:
        'Bản đồ nghĩa vụ theo vai trò doanh nghiệp; danh mục rà soát tuân thủ; lộ trình khắc phục khoảng trống.',
    },
    {
      code: 'B4',
      title: 'Quản trị AI an toàn theo Luật Trí tuệ nhân tạo',
      tagline: 'Ứng dụng AI để tăng trưởng mà không đánh đổi bằng rủi ro pháp lý.',
      duration: '1 ngày',
      audience: 'Ban điều hành, CNTT, pháp chế, khối kinh doanh dùng AI',
      outcomes:
        'Phân loại hệ thống AI theo mức rủi ro; chính sách sử dụng AI nội bộ mẫu; nhận diện và phòng chống deepfake.',
    },
    {
      code: 'B5',
      title: 'Diễn tập ứng phó sự cố cho ban lãnh đạo',
      tagline: 'Lần đầu đối mặt với ransomware không nên là sự cố thật.',
      duration: '0,5 ngày · in-house',
      audience: 'Lãnh đạo, CNTT, truyền thông, pháp chế học cùng nhau',
      outcomes: 'Kịch bản tấn công sát ngành; báo cáo đánh giá mức độ sẵn sàng; kế hoạch cải thiện sau diễn tập.',
    },
    {
      code: 'B6',
      title: 'Nhận thức an ninh mạng cho nhân viên',
      tagline: 'Con người là tuyến phòng thủ đầu tiên.',
      duration: 'E-learning 6 × 15 phút',
      audience: 'Toàn bộ nhân viên',
      outcomes:
        'Nhận diện lừa đảo, email giả mạo, deepfake; quy tắc bảo vệ dữ liệu hằng ngày; bài kiểm tra và báo cáo cho doanh nghiệp.',
    },
  ],

  tiers: [
    {
      level: 1,
      shortLabel: 'Nhóm 1',
      label: 'Nhóm 1 · Hạ tầng trọng yếu',
      depth: 3,
      introLead: 'Chương trình chuyên sâu 5 buổi',
      introBody:
        ' (2 buổi lõi + 2 buổi chuyên ngành + 1 buổi diễn tập), đào tạo cả cấp lãnh đạo lẫn đội kỹ thuật, đồng triển khai với chuyên gia NCA.',
      programs: [
        {
          name: 'Tài chính – Ngân hàng – Chứng khoán – Bảo hiểm – Ví điện tử',
          audience: 'HĐQT, CEO, CRO, CISO, khối vận hành, thanh toán',
          focus: 'Chống gian lận và lừa đảo khách hàng, rủi ro bên thứ ba, khả năng chống chịu vận hành',
          standards: 'FS-ISAC · DORA · PCI DSS',
          launchPeriod: 'Q4/2026',
        },
        {
          name: 'Y tế – Bệnh viện – Dược',
          audience: 'Giám đốc bệnh viện, CNTT y tế, quản lý hồ sơ bệnh án',
          focus: 'Bảo vệ dữ liệu sức khỏe, duy trì khám chữa bệnh khi bị ransomware, thiết bị y tế kết nối',
          standards: 'Health-ISAC · ISO 27799',
          launchPeriod: 'Q4/2026',
        },
        {
          name: 'Viễn thông – CNTT – Điện toán đám mây – Nền tảng số',
          audience: 'Lãnh đạo, CISO, đội vận hành dịch vụ',
          focus: 'Nghĩa vụ chủ hệ thống và nhà cung cấp dịch vụ theo Luật An ninh mạng 2025',
          standards: 'Communications ISAC · IT-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Năng lượng – Điện – Dầu khí – Cấp nước',
          audience: 'Lãnh đạo, kỹ sư vận hành, đội OT',
          focus: 'An ninh hệ thống điều khiển công nghiệp (OT/SCADA), chuỗi cung ứng thiết bị',
          standards: 'E-ISAC · ONG-ISAC · Water-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Khu vực công',
          audience: 'Lãnh đạo cơ quan, đơn vị sự nghiệp, phụ trách chuyển đổi số',
          focus: 'Bảo vệ dữ liệu công dân, an toàn hệ thống thông tin quan trọng',
          standards: 'MS-ISAC',
          launchPeriod: 'H2/2027',
        },
      ],
    },
    {
      level: 2,
      shortLabel: 'Nhóm 2',
      label: 'Nhóm 2 · Rủi ro cao',
      depth: 2,
      introLead: 'Chuyên đề 2 ngày',
      introBody: ' tập trung vào rủi ro đặc thù nhất của từng ngành, kết thúc bằng tình huống mô phỏng cho cấp lãnh đạo.',
      programs: [
        {
          name: 'Đầu tư – Quỹ – Quản lý tài sản',
          audience: 'Lãnh đạo quỹ, CFO, vận hành, tuân thủ',
          focus:
            'Chống email giả mạo lệnh chuyển tiền (BEC), bảo mật thông tin giao dịch, rủi ro mạng của doanh nghiệp trong danh mục',
          standards: 'FS-ISAC',
          launchPeriod: 'Q4/2026',
        },
        {
          name: 'Thẩm định an ninh mạng và dữ liệu trong M&A',
          audience: 'Nhà đầu tư, đội thẩm định, luật sư, tư vấn M&A',
          focus:
            'Rủi ro ẩn của bên mục tiêu, bảo mật phòng dữ liệu (VDR), điều khoản hợp đồng, tích hợp sau sáp nhập',
          standards: 'ISO/IEC 27001 · GDPR',
          launchPeriod: 'Q4/2026',
        },
        {
          name: 'Giáo dục',
          audience: 'Hiệu trưởng, ban giám hiệu, CNTT nhà trường, chủ nền tảng EdTech',
          focus: 'Bảo vệ dữ liệu học sinh (dữ liệu trẻ em), an toàn nền tảng học trực tuyến',
          standards: 'REN-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Sản xuất – Khu công nghiệp',
          audience: 'Giám đốc nhà máy, CNTT/OT, chuỗi cung ứng',
          focus: 'Bảo vệ dây chuyền tự động, bí mật công nghệ, yêu cầu bảo mật của khách hàng FDI',
          standards: 'MFG-ISAC · OT-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Logistics – Cảng biển – Hàng không',
          audience: 'Lãnh đạo, vận hành, CNTT',
          focus: 'Bảo đảm chuỗi cung ứng không bị tê liệt khi có sự cố',
          standards: 'MTS-ISAC · A-ISAC',
          launchPeriod: 'H2/2027',
        },
        {
          name: 'Bán lẻ – Thương mại điện tử – Khách sạn',
          audience: 'Lãnh đạo, marketing, thanh toán, CNTT',
          focus: 'Bảo vệ dữ liệu khách hàng và thẻ thanh toán, chống gian lận trực tuyến',
          standards: 'RH-ISAC · PCI DSS',
          launchPeriod: 'H2/2027',
        },
      ],
    },
    {
      level: 3,
      shortLabel: 'Nhóm 3',
      label: 'Nhóm 3 · Nhận thức & tuân thủ',
      depth: 1,
      introLead: 'E-learning theo ngành + workshop 0,5 ngày',
      introBody:
        ' cho quản lý, kèm báo cáo hoàn thành. Đăng ký theo số lượng nhân sự. Mọi ngành có thể đăng ký gói nhận thức Luật BVDLCN liên ngành từ Q4/2026.',
      programs: [
        {
          name: 'Luật – Kiểm toán – Tư vấn',
          audience: 'Công ty luật, kiểm toán, tư vấn, kế toán',
          focus: 'Bảo mật hồ sơ khách hàng, tuân thủ Luật Bảo vệ dữ liệu cá nhân',
          standards: 'LS-ISAC',
          launchPeriod: 'Q4/2026',
        },
        {
          name: 'Bất động sản – Tòa nhà thông minh',
          audience: 'Chủ đầu tư, môi giới, quản lý vận hành tòa nhà',
          focus: 'Dữ liệu khách hàng, cư dân; hệ thống tòa nhà kết nối',
          standards: 'RE-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Truyền thông – Giải trí',
          audience: 'Agency, nhà sản xuất nội dung, KOL, báo chí',
          focus: 'Phòng chống deepfake, bảo vệ tài khoản mạng xã hội, bản quyền số',
          standards: 'ME-ISAC',
          launchPeriod: 'H1/2027',
        },
        {
          name: 'Ô tô – Xe điện',
          audience: 'Hãng xe, đại lý, dịch vụ hậu mãi',
          focus: 'Dữ liệu người dùng, xe kết nối',
          standards: 'Auto-ISAC',
          launchPeriod: 'H2/2027',
        },
        {
          name: 'Tổ chức phi lợi nhuận, hiệp hội',
          audience: 'Hiệp hội, quỹ, tổ chức xã hội',
          focus: 'Bảo vệ dữ liệu hội viên, nhà tài trợ',
          standards: 'NGO-ISAC',
          launchPeriod: 'H2/2027',
        },
      ],
    },
  ],

  media: [
    {
      group: 'M1',
      name: 'IARIS Cyber Brief',
      tagline: 'Mỗi sáng thứ Hai, một bản tin đủ để lãnh đạo nắm trọn chuyển động về dữ liệu và an ninh mạng.',
      benefits: ['Hiện diện hằng tuần trước CEO, CISO, DPO', 'Thương hiệu gắn với hình ảnh tin cậy, tuân thủ', 'Báo cáo hiệu quả minh bạch hằng tháng'],
      meta: 'Bản tin tuần · Email',
      featured: false,
    },
    {
      group: 'M1',
      name: 'Talk Digi',
      tagline: 'Nghe những người đang trực tiếp giữ an toàn dữ liệu cho doanh nghiệp Việt Nam kể chuyện thật.',
      benefits: ['Lãnh đạo xuất hiện cùng chuyên gia hàng đầu', 'Một tập gốc thành 3–5 video ngắn và 1 bài viết', 'Tiếp cận cộng đồng NCA, VnDSS'],
      meta: 'Podcast · Video',
      featured: false,
    },
    {
      group: 'M1',
      name: 'Cyber Live 72h',
      tagline: 'Luật mới vừa ban hành, sự cố vừa xảy ra: 72 giờ sau doanh nghiệp đã biết cần làm gì.',
      benefits: ['Gắn thương hiệu với thời điểm quan tâm cao nhất', '5 phút chia sẻ trước hàng trăm doanh nghiệp', 'Bản ghi và slide tiếp tục lan tỏa'],
      meta: 'Webinar · Miễn phí',
      featured: false,
    },
    {
      group: 'M1',
      name: 'Scam Alert',
      tagline: 'Nhận diện thủ đoạn lừa đảo mới nhất trong 60 giây.',
      benefits: ['Thể hiện trách nhiệm bảo vệ khách hàng', 'Giảm thiệt hại và khiếu nại do mạo danh', 'Tiếp cận đại chúng với chi phí thấp'],
      meta: 'Video ngắn · 2–3/tuần',
      featured: false,
    },
    {
      group: 'M1',
      name: 'Luật dễ hiểu',
      tagline: 'Bốn đạo luật lớn, giải thích bằng ngôn ngữ của doanh nghiệp.',
      benefits: ['Nội dung giáo dục pháp luật có giá trị lâu dài', 'Dùng được cho đào tạo nội bộ', 'Do luật sư soạn, biên tập viên chuyển ngữ'],
      meta: 'Series video 5–7 phút',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Chiến dịch nhận thức nội bộ',
      tagline: 'Biến nhân viên thành tuyến phòng thủ đầu tiên.',
      benefits: ['Giảm rủi ro sự cố do thao tác con người', 'Bằng chứng đào tạo cho tuân thủ, kiểm toán', 'Đi cùng khóa e-learning B6'],
      meta: 'Chiến dịch 4–6 tuần',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Truyền thông chống lừa đảo cho khách hàng',
      tagline: 'Bảo vệ khách hàng trước khi kẻ gian mạo danh thương hiệu của bạn.',
      benefits: ['Giảm khiếu nại liên quan mạo danh thương hiệu', 'Bảo vệ uy tín và niềm tin khách hàng', 'Kịch bản thống nhất cho tổng đài'],
      meta: 'Ứng dụng · SMS · Mạng xã hội',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Kế hoạch truyền thông khủng hoảng sự cố mạng',
      tagline: 'Khi sự cố xảy ra, những giờ đầu quyết định uy tín của doanh nghiệp.',
      benefits: ['Thông điệp đầu tiên nhanh, nhất quán', 'Đáp ứng nghĩa vụ thông báo theo luật', 'Người phát ngôn được đào tạo trước'],
      meta: 'Playbook · Diễn tập B5',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Hỗ trợ truyền thông khi sự cố',
      tagline: 'Một đội truyền thông khủng hoảng an ninh mạng, luôn sẵn sàng.',
      benefits: ['Cam kết phản hồi trong 2 giờ', 'Theo dõi dư luận và phản ứng kịp thời', 'Bảo mật tuyệt đối theo NDA'],
      meta: 'Gói duy trì hằng tháng',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Truyền thông quyền riêng tư',
      tagline: 'Minh bạch về dữ liệu là lợi thế cạnh tranh.',
      benefits: ['Giảm rủi ro xử phạt về tài liệu quyền riêng tư', 'Tăng niềm tin khi khách hàng chia sẻ dữ liệu', 'Sẵn sàng cho kiểm tra, thẩm định'],
      meta: 'Website · Ứng dụng · Quầy',
      featured: false,
    },
    {
      group: 'M2',
      name: 'Xây dựng hình ảnh chuyên gia',
      tagline: 'Đưa lãnh đạo của bạn thành tiếng nói được tin cậy về an ninh mạng.',
      benefits: ['Nâng uy tín lãnh đạo, CISO, DPO', 'Sân khấu sẵn có trên các kênh IARIS', 'Tiết kiệm thời gian nhờ đội ngũ viết'],
      meta: 'Kế hoạch nội dung dài hạn',
      featured: false,
    },
    {
      group: 'M3',
      name: 'Diễn đàn An ninh mạng Quốc tế',
      tagline: 'Nơi doanh nghiệp Việt Nam gặp gỡ chuyên gia an ninh mạng quốc tế.',
      benefits: [
        'Khẳng định vị thế trước cộng đồng trong nước và quốc tế',
        'Gặp trực tiếp lãnh đạo, CISO, DPO, cơ quan quản lý',
        'Hiện diện 6–9 tháng qua chuỗi truyền thông',
      ],
      meta: 'Thường niên',
      featured: true,
    },
    {
      group: 'M3',
      name: 'Hội thảo theo ngành',
      tagline: 'Đi sâu vào rủi ro an ninh mạng của chính ngành bạn.',
      benefits: ['Tiếp cận đúng ngành mục tiêu', 'Trình bày giải pháp trước người ra quyết định', 'Quan hệ với doanh nghiệp đầu ngành'],
      meta: 'Theo nhóm ngành',
      featured: false,
    },
    {
      group: 'M3',
      name: 'Roundtable CISO & DPO',
      tagline: 'Một bàn tròn kín, nơi CISO và DPO nói thật.',
      benefits: ['Đối thoại sâu với nhóm khó tiếp cận nhất', 'Hiểu đúng vướng mắc thực tế', 'Quan hệ tin cậy lâu dài'],
      meta: 'Hằng tháng · 15–25 người',
      featured: false,
    },
    {
      group: 'M3',
      name: 'Gói đối tác thường niên',
      tagline: 'Một đối tác, hiện diện cả năm trên mọi kênh an ninh mạng của IARIS.',
      benefits: ['Chi phí mỗi lần hiện diện thấp nhất', 'Thông điệp liên tục 12 tháng', 'Vị thế đối tác chiến lược'],
      meta: '12 tháng · Báo cáo quý',
      featured: false,
    },
  ],

  events: [
    {
      slug: 'dien-dan-an-ninh-tai-chinh-2026',
      status: 'up',
      kind: 'ev',
      dateLabel: '06–07',
      periodLabel: 'Tháng 11 · 2026',
      title: 'Diễn đàn Chiến lược & Triển lãm An ninh Tài chính Quốc gia',
      summary:
        'Diễn đàn và triển lãm về an ninh tài chính, IARIS đồng hành cùng Hiệp hội An ninh mạng quốc gia – Chi hội phía Nam.',
      tags: ['Diễn đàn', 'Tài chính – Ngân hàng'],
      ctaLabel: 'Đăng ký tham dự',
    },
    {
      slug: 'cyber-clinic-2026',
      status: 'up',
      kind: 'com',
      dateLabel: 'T11',
      periodLabel: '2026 – T1/2027',
      title: 'CYBER CLINIC 2026 – Sinh viên Bác sĩ An ninh mạng',
      summary:
        'Đội sinh viên các trường đại học phía Nam thực hiện đánh giá an ninh mạng cho doanh nghiệp nhỏ, hướng tới câu lạc bộ sinh viên an ninh mạng toàn quốc. Chỉ đạo: NCA Chi hội phía Nam.',
      tags: ['Cuộc thi', 'Sinh viên'],
      ctaLabel: 'Đăng ký doanh nghiệp tham gia',
    },
    {
      slug: 'cyber-live-72h-luat-an-ninh-mang-2025',
      status: 'web',
      kind: 'web',
      dateLabel: '72h',
      periodLabel: 'Dự kiến tháng 11',
      title: 'Cyber Live 72h: Luật An ninh mạng 2025 sau 4 tháng hiệu lực',
      summary:
        'Những nghĩa vụ doanh nghiệp thường bỏ sót và 5 việc cần làm ngay. Diễn giả từ NCA, VnDSS và luật sư đối tác.',
      tags: ['Webinar', 'Miễn phí'],
      ctaLabel: 'Nhận link tham dự',
    },
    {
      slug: 'cyber-live-72h-nghi-dinh-356',
      status: 'web',
      kind: 'web',
      dateLabel: '72h',
      periodLabel: 'Dự kiến tháng 12',
      title: 'Cyber Live 72h: Chuyển dữ liệu xuyên biên giới theo Nghị định 356/2025',
      summary: 'Hồ sơ đánh giá tác động chuyển dữ liệu ra nước ngoài cho doanh nghiệp FDI, M&A và nền tảng số.',
      tags: ['Webinar', 'DPO'],
      ctaLabel: 'Nhận link tham dự',
    },
    {
      slug: 'roundtable-ciso-dpo',
      status: 'up',
      kind: 'ev',
      dateLabel: 'Hằng',
      periodLabel: 'tháng',
      title: 'Roundtable CISO & DPO theo ngành',
      summary:
        'Bàn tròn kín 15–25 người, luân phiên ngành, nguyên tắc không trích dẫn danh tính. Dành cho CISO, DPO được mời.',
      tags: ['Roundtable', 'Theo lời mời'],
      ctaLabel: 'Đề cử tham dự',
    },
    {
      slug: 'workshop-ai-deepfake-2026',
      status: 'past',
      kind: 'past',
      dateLabel: '18',
      periodLabel: 'Tháng 9 · 2026',
      title: 'Workshop AI & Deepfake',
      summary: 'Workshop chung của IARIS và NCA về nhận diện, phòng chống deepfake trong doanh nghiệp.',
      tags: ['Đã diễn ra'],
      ctaLabel: 'Xem tóm tắt',
    },
  ],

  lessons: [
    {
      position: 1,
      title: 'Lừa đảo qua email và tin nhắn',
      summary: 'Nhận diện email giả mạo hóa đơn, tin nhắn mạo danh ngân hàng và đường link độc hại trước khi bấm.',
      durationMin: 15,
    },
    {
      position: 2,
      title: 'Deepfake giọng nói và hình ảnh',
      summary: 'Cách xác minh khi "sếp" gọi video yêu cầu chuyển tiền gấp, và quy trình gọi lại để kiểm tra.',
      durationMin: 15,
    },
    {
      position: 3,
      title: 'Mật khẩu và xác thực đa lớp',
      summary: 'Đặt mật khẩu đủ mạnh, dùng trình quản lý mật khẩu và bật xác thực 2 lớp cho tài khoản công việc.',
      durationMin: 15,
    },
    {
      position: 4,
      title: 'Bảo vệ dữ liệu cá nhân khi làm việc',
      summary: 'Những thao tác hằng ngày dễ làm lộ dữ liệu khách hàng, theo yêu cầu của Luật Bảo vệ dữ liệu cá nhân.',
      durationMin: 15,
    },
    {
      position: 5,
      title: 'Thiết bị và mạng an toàn',
      summary: 'Wi-Fi công cộng, USB lạ, cập nhật phần mềm và làm việc từ xa an toàn.',
      durationMin: 15,
    },
    {
      position: 6,
      title: 'Báo cáo sự cố',
      summary: 'Khi nghi ngờ bị tấn công: báo cho ai, báo trong bao lâu, và những việc không được làm.',
      durationMin: 15,
    },
  ],

  quiz: [
    {
      position: 1,
      scenario: 'Email gửi phòng kế toán lúc 17:45:',
      message:
        'Từ: giamdoc.congty@gmai1.com\nChủ đề: GẤP – chuyển khoản đối tác\nAnh/chị chuyển giúp 480.000.000đ cho đối tác mới trong hôm nay, tôi đang họp không nghe máy được.',
      options: [
        'Chuyển ngay vì là yêu cầu của giám đốc',
        'Gọi lại giám đốc qua số đã lưu sẵn để xác minh, không trả lời email',
        'Trả lời email hỏi lại số tài khoản',
      ],
      correctIndex: 1,
      explanation:
        'Đây là dấu hiệu email giả mạo lệnh chuyển tiền (BEC): tên miền sai một ký tự, tạo áp lực thời gian, né kênh xác minh. Luôn xác minh qua kênh khác đã biết trước.',
    },
    {
      position: 2,
      scenario: 'Tin nhắn SMS gửi tới điện thoại công việc:',
      message: '[NganHang] Tai khoan cua ban se bi khoa sau 2 gio. Xac thuc tai: nganhang-xacthuc.vip',
      options: ['Bấm link để xác thực cho nhanh', 'Bỏ qua, chặn số và báo cho bộ phận CNTT', 'Trả lời tin nhắn để hỏi thêm'],
      correctIndex: 1,
      explanation:
        'Ngân hàng không gửi đường link yêu cầu xác thực qua SMS. Tên miền lạ và lời đe dọa khóa tài khoản là thủ đoạn quen thuộc.',
    },
    {
      position: 3,
      scenario: 'Cuộc gọi video từ "CFO" trên ứng dụng nhắn tin:',
      message:
        'Hình ảnh và giọng nói giống CFO, mạng chập chờn. Đề nghị bạn gửi ngay danh sách lương và thông tin cá nhân của nhân viên để "kiểm toán gấp".',
      options: [
        'Gửi vì đã nhìn thấy mặt CFO',
        'Từ chối gửi qua kênh này, xác minh trực tiếp và báo cho DPO',
        'Gửi một phần dữ liệu trước',
      ],
      correctIndex: 1,
      explanation:
        'Deepfake có thể giả cả hình và tiếng. Dữ liệu nhân viên là dữ liệu cá nhân được bảo vệ theo luật; mọi yêu cầu bất thường cần được xác minh và báo cho người phụ trách bảo vệ dữ liệu.',
    },
  ],
};

/** Course whose lessons/quiz are shown in the e-learning preview */
export const ELEARNING_COURSE_CODE = 'B6';

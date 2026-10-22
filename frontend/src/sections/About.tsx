import { SectionHead } from '../components/SectionHead';

const ACRONYM = [
  { letter: 'R', title: 'Responsible', text: 'Lãnh đạo có trách nhiệm với dữ liệu của khách hàng, nhân viên và cộng đồng.' },
  { letter: 'I', title: 'Inspiring', text: 'Lãnh đạo truyền cảm hứng để cả tổ chức trở thành tuyến phòng thủ chung.' },
  { letter: 'S', title: 'Strategic', text: 'Lãnh đạo coi rủi ro mạng là một rủi ro chiến lược, có ngân sách và lộ trình.' },
];

const VALUES = [
  { title: 'Responsible – Trách nhiệm', text: 'Nội dung chính xác, kiểm chứng nguồn, tuân thủ pháp luật.' },
  { title: 'Insightful – Thấu suốt', text: 'Không chỉ đưa tin, mà giải thích tác động và việc cần làm tiếp.' },
  { title: 'Strategic – Chiến lược', text: 'Mọi chương trình kết thúc bằng hành động cụ thể cho doanh nghiệp.' },
  { title: 'Engaged – Kết nối', text: 'Đối thoại hai chiều giữa doanh nghiệp, chuyên gia và cơ quan quản lý.' },
];

const LOOP = [
  { title: 'Media', text: 'Bản tin, webinar, podcast' },
  { title: 'Academy', text: 'Khóa nền tảng và chuyên ngành' },
  { title: 'Circle', text: 'Cộng đồng CISO & DPO' },
  { title: 'Advisory', text: 'Tư vấn tuân thủ dữ liệu' },
];

const PHASES = [
  {
    when: '2026–2027',
    title: 'IARIS Cyber & Data',
    text: 'Truyền thông và đào tạo an ninh mạng, dữ liệu cho 16 ngành, triển khai đồng loạt 3 nhóm từ Q4/2026.',
  },
  { when: 'Từ 2028', title: 'Mở rộng đa lĩnh vực', text: 'Chính sách mới, chiến lược pháp lý, đầu tư và tăng trưởng cho CEO.' },
];

const PARTNERS = ['Hiệp hội An ninh mạng quốc gia (NCA) – Chi hội phía Nam', 'VnDSS', 'Hệ sinh thái MABS Group'];

export function About() {
  return (
    <section className="block" id="about">
      <div className="wrap">
        <SectionHead eyebrow="Về IARIS" title="Viện đào tạo quốc tế dành cho lãnh đạo, bắt đầu từ an ninh mạng và dữ liệu">
          IARIS là viết tắt của <b>International Advancement for Responsible, Inspiring and Strategic Leaders</b>. Trong
          giai đoạn 2026–2027, IARIS là kênh truyền thông và học viện chuyên về an ninh mạng, dữ liệu theo ngành, vận hành
          dưới pháp nhân Công ty TNHH M.A.B Solutions.
        </SectionHead>

        <div className="acronym">
          {ACRONYM.map((a) => (
            <div key={a.letter}>
              <span className="L">{a.letter}</span>
              <h4>{a.title}</h4>
              <p>{a.text}</p>
            </div>
          ))}
        </div>

        <div className="about-grid">
          <div className="panel">
            <h3>Sứ mệnh 2026–2027</h3>
            <p className="muted">
              Giúp lãnh đạo và đội ngũ doanh nghiệp Việt Nam trong từng ngành hiểu đúng nghĩa vụ về dữ liệu và an ninh
              mạng, quản trị được rủi ro mạng như một rủi ro kinh doanh, và sẵn sàng ứng phó sự cố.
            </p>
            <p className="muted">
              <b style={{ color: 'var(--fg)' }}>Tầm nhìn 2030:</b> trở thành nền tảng truyền thông và giáo dục doanh nhân
              được tin cậy hàng đầu Việt Nam về chính sách, pháp lý và đầu tư; cầu nối thường xuyên giữa cơ quan hoạch định
              chính sách, chuyên gia và cộng đồng 10.000 CEO.
            </p>
            <div className="rise">
              {VALUES.map((v) => (
                <div key={v.title}>
                  <b>{v.title}</b>
                  <p>{v.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <h3>Cách IARIS vận hành</h3>
            <p className="muted">
              Truyền thông tạo niềm tin, đào tạo chuyển niềm tin thành năng lực, cộng đồng giữ kết nối, tư vấn tạo bài học
              mới cho truyền thông.
            </p>
            <div className="loop">
              {LOOP.map((l) => (
                <div key={l.title}>
                  <b>{l.title}</b>
                  <span>{l.text}</span>
                </div>
              ))}
            </div>
            <div className="phases">
              {PHASES.map((p) => (
                <div className="phase" key={p.when}>
                  <span className="mono">{p.when}</span>
                  <div>
                    <b>{p.title}</b>
                    <p>{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="partners" aria-label="Đối tác">
              {PARTNERS.map((p) => (
                <span className="chip" key={p}>
                  <i />
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';
import type { Course, SectorTier } from '../../../shared/types';
import { SectionHead } from '../components/SectionHead';
import { Tabs } from '../components/Tabs';
import { launchPillClass } from '../lib/format';

const WHY = [
  { title: 'Thiết kế theo ngành', text: 'Tình huống, quy định và chuẩn mực của chính ngành bạn.' },
  {
    title: 'Lãnh đạo + pháp lý + kỹ thuật',
    text: 'Giảng viên là chuyên gia an ninh mạng, luật sư dữ liệu và CISO đang làm việc.',
  },
  { title: 'Thực hành là chính', text: 'Diễn tập, tình huống mô phỏng, hồ sơ mẫu dùng được ngay.' },
  { title: 'Chuẩn quốc tế', text: 'Tham chiếu NIST CSF 2.0, ISO/IEC 27001 và mô hình ISAC theo ngành.' },
  { title: 'Mạng lưới đối tác', text: 'NCA, VnDSS và hội đồng chuyên gia 15–20 người.' },
];

const FORMATS = [
  { title: 'Lớp mở', text: 'TP.HCM, Hà Nội · cá nhân hoặc doanh nghiệp cử 1–5 học viên' },
  { title: 'In-house', text: 'Đào tạo cả ban lãnh đạo hoặc nhiều phòng ban' },
  { title: 'Trực tuyến trực tiếp', text: 'Học viên ở xa, lịch linh hoạt' },
  { title: 'E-learning', text: 'Nhận thức cho số lượng lớn nhân viên' },
];

function CourseCard({ c }: { c: Course }) {
  return (
    <article className="course">
      <div className="top">
        <span className="code">{c.code}</span>
        <span className="dur">{c.duration}</span>
      </div>
      <h3>{c.title}</h3>
      <q>{c.tagline}</q>
      <dl>
        <div>
          <dt>Dành cho</dt>
          <dd>{c.audience}</dd>
        </div>
        <div>
          <dt>Bạn nhận được</dt>
          <dd>{c.outcomes}</dd>
        </div>
      </dl>
    </article>
  );
}

function TierPanel({ tier }: { tier: SectorTier }) {
  return (
    <div id="tierPanel" role="tabpanel">
      <div className="tier-intro">
        <div className="meter" aria-label={`Mức độ học sâu ${tier.depth}/3`}>
          {[1, 2, 3].map((i) => (
            <i key={i} className={i <= tier.depth ? 'on' : ''} />
          ))}
        </div>
        <p>
          <span className="mono" style={{ color: 'var(--copper)' }}>
            {tier.label}
          </span>
          <br />
          <b>{tier.introLead}</b>
          {tier.introBody}
        </p>
      </div>
      <div className="tbl">
        <table>
          <thead>
            <tr>
              <th>Chương trình</th>
              <th>Dành cho</th>
              <th>Trọng tâm</th>
              <th>Khai giảng</th>
            </tr>
          </thead>
          <tbody>
            {tier.programs.map((p) => (
              <tr key={p.name}>
                <td>
                  {p.name}
                  <div className="isac">{p.standards}</div>
                </td>
                <td>{p.audience}</td>
                <td>{p.focus}</td>
                <td>
                  <span className={`pill ${launchPillClass(p.launchPeriod)}`}>{p.launchPeriod}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Courses({ courses, tiers }: { courses: Course[]; tiers: SectorTier[] }) {
  const [level, setLevel] = useState(String(tiers[0]?.level ?? 1));
  const tier = tiers.find((t) => String(t.level) === level) ?? tiers[0];

  return (
    <section className="block alt" id="courses">
      <div className="wrap">
        <SectionHead eyebrow="IARIS Academy" title="Chương trình đào tạo an ninh mạng và bảo vệ dữ liệu">
          {courses.length} khóa nền tảng dùng chung cho mọi doanh nghiệp, và chương trình chuyên ngành cho{' '}
          {tiers.reduce((n, t) => n + t.programs.length, 0)} ngành chia thành {tiers.length} nhóm theo mức độ cần học sâu.
        </SectionHead>

        <div className="found" id="foundation">
          {courses.map((c) => (
            <CourseCard key={c.code} c={c} />
          ))}
        </div>

        <div className="subhead">
          <div>
            <h3>Chương trình chuyên ngành</h3>
            <p>
              Ngành được xếp nhóm theo 4 tiêu chí: giữ dữ liệu nhạy cảm giá trị cao, vận hành hạ tầng có hậu quả vật lý khi
              sự cố, bị quản lý chặt, và thiệt hại lớn khi ngưng hoạt động.
            </p>
          </div>
          <Tabs
            id="tierTabs"
            items={tiers.map((t) => ({ key: String(t.level), label: t.shortLabel }))}
            selected={level}
            onSelect={setLevel}
          />
        </div>
        {tier && <TierPanel tier={tier} />}

        <div className="why">
          {WHY.map((w) => (
            <div key={w.title}>
              <b>{w.title}</b>
              <p>{w.text}</p>
            </div>
          ))}
        </div>

        <div className="formats">
          {FORMATS.map((f) => (
            <div key={f.title}>
              <b>{f.title}</b>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
        <p className="cert">
          Học viên hoàn thành đủ thời lượng và bài đánh giá cuối khóa được cấp <b>Chứng nhận hoàn thành của IARIS</b>. Học
          viên Nhóm 1 và khóa DPO được tham gia <b>CISO &amp; DPO Circle</b>, cộng đồng chia sẻ thông tin và sự cố theo
          ngành.
        </p>
      </div>
    </section>
  );
}

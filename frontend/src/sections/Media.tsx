import { useState } from 'react';
import type { MediaGroupCode, MediaService } from '../../../shared/types';
import { SectionHead } from '../components/SectionHead';
import { Tabs } from '../components/Tabs';

type Filter = 'all' | MediaGroupCode;

const GROUP_TAB: Record<MediaGroupCode, string> = {
  M1: 'Kênh đồng sở hữu',
  M2: 'Dịch vụ cho doanh nghiệp',
  M3: 'Sự kiện & tài trợ',
};
const GROUP_LABEL: Record<MediaGroupCode, string> = {
  M1: 'M1 · Kênh đồng sở hữu',
  M2: 'M2 · Truyền thông cho doanh nghiệp',
  M3: 'M3 · Sự kiện & tài trợ',
};

const PRINCIPLES = [
  'Chỉ truyền thông ở góc độ phòng thủ, quản trị và tuân thủ; không công bố chi tiết kỹ thuật tấn công hoặc lỗ hổng chưa được vá.',
  'Không nêu tên doanh nghiệp bị sự cố khi chưa có công bố chính thức.',
  'Thông tin về sự cố, thủ đoạn lừa đảo được kiểm chứng từ ít nhất 2 nguồn tin cậy.',
  'Nội dung pháp lý do luật sư đối tác duyệt, ghi rõ không phải ý kiến pháp lý.',
  'Nội dung có tài trợ được gắn nhãn; nhà tài trợ không sửa nội dung biên tập.',
  'Thông tin khách hàng dịch vụ được bảo mật theo thỏa thuận bảo mật (NDA).',
  'Kênh IARIS là trang thông tin doanh nghiệp, không phải cơ quan báo chí.',
];

function ServiceCard({ s }: { s: MediaService }) {
  return (
    <article className={`svc ${s.featured ? 'feature' : ''}`}>
      <span className="grp">{GROUP_LABEL[s.group]}</span>
      <h3>{s.name}</h3>
      <p className="tag">{s.tagline}</p>
      <ul>
        {s.benefits.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <div className="meta">
        <span>{s.meta}</span>
        <a href="#contact" style={{ color: 'inherit' }}>
          Nhận báo giá →
        </a>
      </div>
    </article>
  );
}

export function Media({ media }: { media: MediaService[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = media.filter((s) => filter === 'all' || s.group === filter);
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `Tất cả (${media.length})` },
    ...(Object.keys(GROUP_TAB) as MediaGroupCode[]).map((k) => ({ key: k, label: GROUP_TAB[k] })),
  ];

  return (
    <section className="block" id="media">
      <div className="wrap">
        <SectionHead eyebrow="IARIS Media" title="Truyền thông an ninh mạng cho đúng người ra quyết định">
          Các kênh nội dung được IARIS đồng sở hữu cùng VnDSS và Chi hội NCA phía Nam. Người đọc, người xem là CEO, CISO,
          DPO và pháp chế. Mọi nội dung qua kiểm duyệt 2 lớp: chuyên gia an ninh mạng và luật sư đối tác.
        </SectionHead>
        <Tabs id="mediaTabs" items={tabs} selected={filter} onSelect={setFilter} style={{ display: 'inline-flex' }} />
        <div className="media-grid" id="mediaGrid">
          {list.map((s) => (
            <ServiceCard key={s.name} s={s} />
          ))}
        </div>

        <div className="principles">
          <div>
            <div className="mono" style={{ color: 'var(--copper)' }}>
              Cam kết biên tập
            </div>
            <h3 style={{ fontSize: '1.4rem', marginTop: 10 }}>7 nguyên tắc cho mọi nội dung IARIS Media</h3>
            <p style={{ color: 'var(--muted)', marginTop: 10, fontSize: '.93rem' }}>
              Truyền thông về an ninh mạng có thể gây hại nếu sai hoặc làm lộ thông tin nhạy cảm. Đây là cam kết của IARIS
              với doanh nghiệp đồng hành.
            </p>
          </div>
          <ol>
            {PRINCIPLES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

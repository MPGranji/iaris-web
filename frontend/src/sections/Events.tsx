import { useState } from 'react';
import type { EventStatusCode, SiteEvent } from '../../../shared/types';
import { SectionHead } from '../components/SectionHead';
import { Tabs } from '../components/Tabs';

type Filter = 'all' | EventStatusCode;

const TABS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'up', label: 'Sắp diễn ra' },
  { key: 'web', label: 'Webinar' },
  { key: 'past', label: 'Đã diễn ra' },
];

interface EventsProps {
  events: SiteEvent[];
  /** Called when a visitor clicks an event CTA – pre-fills the contact form */
  onRegister: (event: SiteEvent) => void;
}

export function Events({ events, onRegister }: EventsProps) {
  const [filter, setFilter] = useState<Filter>('all');
  const list = events.filter((e) => filter === 'all' || e.status === filter);

  return (
    <section className="block" id="events">
      <div className="wrap">
        <SectionHead eyebrow="Sự kiện & Webinar" title="Gặp chuyên gia, cập nhật luật mới, kết nối cùng ngành">
          Cyber Live 72h giải mã văn bản mới hoặc sự cố lớn trong 72 giờ. Roundtable CISO &amp; DPO tổ chức kín hằng tháng.
          Diễn đàn và hội thảo theo ngành kết nối doanh nghiệp với chuyên gia và cơ quan quản lý.
        </SectionHead>
        <Tabs id="evTabs" items={TABS} selected={filter} onSelect={setFilter} style={{ display: 'inline-flex' }} />
        <div className="ev-list" id="evList">
          {list.map((e) => {
            const past = e.status === 'past';
            return (
              <article className={`ev ${past ? 'past' : ''}`} key={e.slug}>
                <div className="date">
                  <b>{e.dateLabel}</b>
                  <span>{e.periodLabel}</span>
                </div>
                <div>
                  <div className="kind">
                    {e.tags.map((t, i) => (
                      <span key={t} className={`pill k-${i ? 'past' : e.kind}`}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3>{e.title}</h3>
                  <p>{e.summary}</p>
                </div>
                <div className="act">
                  <a
                    className={`btn ${past ? 'btn-ghost' : 'btn-primary'}`}
                    href="#contact"
                    data-ev={e.title}
                    onClick={() => onRegister(e)}
                  >
                    {e.ctaLabel}
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

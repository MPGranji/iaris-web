import type { Law } from '../../../shared/types';
import { formatDateVN } from '../lib/format';
import { NetworkCanvas } from './NetworkCanvas';

export function Hero({ laws }: { laws: Law[] }) {
  return (
    <header className="hero" id="top">
      <NetworkCanvas />
      <div className="wrap">
        <div>
          <span className="status mono reveal">
            <span className="dot" />
            Đào tạo &amp; truyền thông an ninh mạng theo ngành
          </span>
          <h1 className="reveal d1">
            An toàn dữ liệu.
            <br />
            <em>Vững vàng</em> <span className="cu">tăng trưởng.</span>
          </h1>
          <p className="lead reveal d2">
            IARIS Cyber &amp; Data đào tạo an ninh mạng và bảo vệ dữ liệu cho lãnh đạo và đội ngũ doanh nghiệp Việt Nam,
            thiết kế riêng cho từng ngành. Rủi ro mạng nay là rủi ro kinh doanh, và trách nhiệm cuối cùng thuộc về ban
            lãnh đạo.
          </p>
          <div className="cta reveal d3">
            <a className="btn btn-primary" href="#courses">
              Xem chương trình đào tạo
            </a>
            <a className="btn btn-ghost" href="#events">
              Lịch sự kiện &amp; webinar
            </a>
          </div>
        </div>
        <aside className="laws reveal d2" aria-label="Các đạo luật mới">
          <header>
            <span className="mono">{laws.length} đạo luật · 12 tháng</span>
            <span className="mono" style={{ color: 'var(--signal)' }}>
              ● Đang hiệu lực
            </span>
          </header>
          <ol>
            {laws.map((l) => (
              <li key={l.name}>
                <time dateTime={l.effectiveDate}>{formatDateVN(l.effectiveDate)}</time>
                <div>
                  <b>{l.name}</b>
                  <span>{l.detail}</span>
                </div>
              </li>
            ))}
          </ol>
          <footer>Doanh nghiệp của bạn đã sẵn sàng với cả bốn?</footer>
        </aside>
      </div>
    </header>
  );
}

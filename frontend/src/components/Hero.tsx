import type { Law } from "../../../shared/types";
import { formatDateVN } from "../lib/format";
import { NetworkCanvas } from "./NetworkCanvas";
import { useSiteSection } from "../hooks/useSiteSection";

export function Hero({ laws }: { laws: Law[] }) {
  const section = useSiteSection("hero");
  const [firstLine, ...rest] = section.title.split("\n");
  return (
    <header className="hero" id="top">
      <NetworkCanvas />
      <div className="wrap">
        <div>
          <span className="status mono reveal">
            <span className="dot" />
            {section.subtitle}
          </span>
          <h1 className="reveal d1">
            {firstLine}
            {rest.length > 0 && (
              <>
                <br />
                <em>{rest.join(" ")}</em>
              </>
            )}
          </h1>
          <p className="lead reveal d2">{section.body}</p>
          <div className="cta reveal d3">
            <a className="btn btn-primary" href="#courses">
              {section.buttonLabel}
            </a>
            <a className="btn btn-ghost" href="#events">
              Lịch sự kiện &amp; webinar
            </a>
          </div>
        </div>
        <aside className="laws reveal d2" aria-label="Các đạo luật mới">
          <header>
            <span className="mono">{laws.length} đạo luật · 12 tháng</span>
            <span className="mono" style={{ color: "var(--signal)" }}>
              ● Đang hiệu lực
            </span>
          </header>
          <ol>
            {laws.map((l) => (
              <li key={l.name}>
                <time dateTime={l.effectiveDate}>
                  {formatDateVN(l.effectiveDate)}
                </time>
                <div>
                  <b>{l.name}</b>
                  <span>{l.detail}</span>
                </div>
              </li>
            ))}
          </ol>
          <footer>
            Doanh nghiệp của bạn đã sẵn sàng với các quy định mới?
          </footer>
        </aside>
      </div>
    </header>
  );
}

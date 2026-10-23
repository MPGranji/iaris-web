import { useSiteSection } from "../hooks/useSiteSection";

export function Footer() {
  const section = useSiteSection("footer");
  return (
    <footer className="site">
      <div className="wrap">
        <div>
          <a className="logo" href="#top">
            <span>
              <b>{section.title}</b>
              <small>{section.subtitle}</small>
            </span>
          </a>
          <p style={{ marginTop: 14 }}>{section.body}</p>
        </div>
        <p>
          Nội dung chương trình chỉ nhằm mục đích đào tạo, không thay thế ý kiến
          tư vấn pháp lý cho trường hợp cụ thể. © 2026 IARIS.
        </p>
      </div>
    </footer>
  );
}

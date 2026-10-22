import { useState, type MouseEvent } from 'react';
import { ShieldMark } from './Logo';

const LINKS = [
  { href: '#about', label: 'Về IARIS' },
  { href: '#courses', label: 'Khóa học' },
  { href: '#media', label: 'IARIS Media' },
  { href: '#elearning', label: 'E-learning' },
  { href: '#events', label: 'Sự kiện & Webinar' },
  { href: '#contact', label: 'Liên hệ' },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  const closeOnLink = (e: MouseEvent<HTMLUListElement>) => {
    if ((e.target as HTMLElement).tagName === 'A') setOpen(false);
  };

  return (
    <nav className="nav" aria-label="Điều hướng chính">
      <div className="wrap">
        <a className="logo" href="#top" aria-label="IARIS – trang chủ">
          <ShieldMark />
          <span>
            <b>IARIS</b>
            <small>Cyber &amp; Data</small>
          </span>
        </a>
        <button className="menu-btn" id="menuBtn" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
          Menu
        </button>
        <ul id="menu" className={open ? 'open' : undefined} onClick={closeOnLink}>
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
        <a className="btn btn-primary" href="#contact">
          Đăng ký tư vấn
        </a>
      </div>
    </nav>
  );
}

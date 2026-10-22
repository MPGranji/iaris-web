import type { ReactNode } from 'react';

interface SectionHeadProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function SectionHead({ eyebrow, title, children }: SectionHeadProps) {
  return (
    <div className="sec-head">
      <div>
        <div className="mono">{eyebrow}</div>
        <h2>{title}</h2>
      </div>
      <p>{children}</p>
    </div>
  );
}

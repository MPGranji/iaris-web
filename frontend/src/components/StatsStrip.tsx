import type { SiteContent } from '../../../shared/types';

/** Numbers are derived from the content itself, so they stay correct when data changes. */
export function StatsStrip({ content }: { content: SiteContent }) {
  const sectors = content.tiers.reduce((n, t) => n + t.programs.length, 0);
  const stats = [
    { value: content.courses.length, label: 'khóa nền tảng liên ngành' },
    { value: sectors, label: 'ngành có chương trình riêng' },
    { value: content.media.length, label: 'dịch vụ truyền thông IARIS Media' },
    { value: content.tiers.length, label: 'nhóm ngành theo mức độ học sâu' },
  ];
  return (
    <div className="strip">
      <div className="wrap">
        {stats.map((s) => (
          <div key={s.label}>
            <b>{s.value}</b>
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** "2025-07-01" → "01/07/2025" */
export function formatDateVN(iso: string): string {
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** Colour class of the launch-period pill: Q4 = now, H1 = next, otherwise later */
export function launchPillClass(period: string): string {
  if (period.startsWith('Q4')) return 'p-now';
  if (period.startsWith('H1')) return 'p-h1';
  return 'p-h2';
}

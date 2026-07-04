// "YYYY-MM-DD" → "YYYY.M.D" (例: 2026-07-02 → 2026.7.2)
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${Number(m)}.${Number(d)}`;
}

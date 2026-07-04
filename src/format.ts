// "YYYY-MM-DD" → "YYYY.M.D" (例: 2026-07-02 → 2026.7.2)
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${Number(m)}.${Number(d)}`;
}

// "YYYY-MM-DD" → ["YYYY", "M.D"] スタンプ内の2行表示用
export function formatDateLines(iso: string): [string, string] {
  const [y, m, d] = iso.split("-");
  return [y, `${Number(m)}.${Number(d)}`];
}

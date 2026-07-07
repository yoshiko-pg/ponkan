import type { Exhibition } from "./types";

// "YYYY-MM-DD" → "YYYY.M.D" (例: 2026-07-02 → 2026.7.2)
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${y}.${Number(m)}.${Number(d)}`;
}

// Date → "YYYY-MM-DD"(ローカルタイムゾーン基準)
export function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "2026-09-23" → "9/23"(年が今年でなければ "2027/1/12")
export function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const thisYear = new Date().getFullYear();
  return y === thisYear ? `${m}/${d}` : `${y}/${m}/${d}`;
}

// 特別展の会期表示。片側しか取得できていない場合にも対応する
export function formatTerm(ex: Exhibition): string {
  if (ex.startDate && ex.endDate)
    return `${formatDay(ex.startDate)} – ${formatDay(ex.endDate)}`;
  if (ex.endDate) return `〜 ${formatDay(ex.endDate)}まで`;
  if (ex.startDate) return `${formatDay(ex.startDate)} 〜`;
  return "会期はサイトを確認";
}

// "YYYY-MM-DD" → ["YYYY", "M.D"] スタンプ内の2行表示用
export function formatDateLines(iso: string): [string, string] {
  const [y, m, d] = iso.split("-");
  return [y, `${Number(m)}.${Number(d)}`];
}

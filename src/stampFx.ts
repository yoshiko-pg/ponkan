import { CATEGORY_LABEL } from "./types";
import type { Facility, VisitRecord } from "./types";
import { toDateString } from "./format";

// ハンコが紙に当たるまでの時間。振動・紙吹雪・インクの出現をこの瞬間にそろえる
export const STAMP_IMPACT_MS = 220;

// 通算スタンプ数の節目。到達したときは演出を派手にする
const MILESTONES = [10, 25, 50, 100, 150];

// スタンプを押した瞬間の演出内容。押す直前の状態から決める
export interface StampFx {
  // 押すたびに変わる値。演出要素のkeyにして毎回アニメーションを再生し、紙吹雪の乱数の種にもする
  id: number;
  // new: はじめて押した / revisit: 別の日に押し直した / again: 同じ日にもう一度押した
  kind: "new" | "revisit" | "again";
  message: string;
  // はじめての1館・節目・コンプリートは演出を派手にする
  big: boolean;
  // 押した後のカテゴリ内の訪問済み数と施設数
  catVisited: number;
  catTotal: number;
  // againが続いた回数。「ポンポン…」と伸ばすのに使う
  streak: number;
}

export function makeStampFx(
  facility: Facility,
  facilities: Facility[],
  visits: Record<string, VisitRecord>,
  prevFx: StampFx | null,
  now: Date,
): StampFx {
  const today = toDateString(now);
  const prev = visits[facility.id];
  const isVisited = (f: Facility) =>
    f.id === facility.id || visits[f.id] != null;
  const sameCategory = facilities.filter(
    (f) => f.category === facility.category,
  );
  const base = {
    id: now.getTime(),
    catVisited: sameCategory.filter(isVisited).length,
    catTotal: sameCategory.length,
    big: false,
    streak: 0,
  };

  if (prev?.date === today) {
    const streak = (prevFx?.kind === "again" ? prevFx.streak : 0) + 1;
    return {
      ...base,
      kind: "again",
      streak,
      message: `${"ポン".repeat(Math.min(streak + 1, 5))}!`,
    };
  }
  if (prev) {
    const since = formatSince(prev.date, today);
    return {
      ...base,
      kind: "revisit",
      message: since ? `${since}のポン!` : "おかえりのポン!",
    };
  }

  const total = facilities.filter(isVisited).length;
  const celebrate = (message: string): StampFx => ({
    ...base,
    kind: "new",
    message,
    big: true,
  });
  if (total === facilities.length) return celebrate("全館コンプリート!");
  if (base.catVisited === base.catTotal) {
    return celebrate(`${CATEGORY_LABEL[facility.category]}コンプリート!`);
  }
  if (total === 1) return celebrate("はじめてのポン!");
  return {
    ...base,
    kind: "new",
    message: `${total}館目のポン!`,
    big: MILESTONES.includes(total),
  };
}

// 前回の訪問日から今日までを「3か月ぶり」のように言う。前回が未来の日付なら null
function formatSince(from: string, to: string): string | null {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  const months = (y2 - y1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0);
  if (months >= 12) return `${Math.floor(months / 12)}年ぶり`;
  if (months >= 1) return `${months}か月ぶり`;
  const days = Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
  return days >= 1 ? `${days}日ぶり` : null;
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

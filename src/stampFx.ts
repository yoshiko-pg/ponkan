import type { Facility, VisitRecord } from "./types";

// ハンコが紙に当たるまでの時間。振動・紙吹雪・インクの出現をこの瞬間にそろえる
export const STAMP_IMPACT_MS = 220;

// 通算スタンプ数の節目。到達したときは演出を派手にする
const MILESTONES = [10, 25, 50, 100, 150];

// スタンプを押した瞬間の演出内容。押す直前の状態から決める
export interface StampFx {
  // 押すたびに変わる値。演出要素のkeyにして毎回アニメーションを再生し、紙吹雪の乱数の種にもする
  id: number;
  // はじめて押したか(押し直しではないか)
  fresh: boolean;
  // はじめての1館・節目・コンプリートは演出を派手にする
  big: boolean;
}

export function makeStampFx(
  facility: Facility,
  facilities: Facility[],
  visits: Record<string, VisitRecord>,
  now: Date,
): StampFx {
  const id = now.getTime();
  if (visits[facility.id]) return { id, fresh: false, big: false };

  const isVisited = (f: Facility) =>
    f.id === facility.id || visits[f.id] != null;
  const total = facilities.filter(isVisited).length;
  const sameCategory = facilities.filter(
    (f) => f.category === facility.category,
  );
  const big =
    total === 1 || MILESTONES.includes(total) || sameCategory.every(isVisited);
  return { id, fresh: true, big };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

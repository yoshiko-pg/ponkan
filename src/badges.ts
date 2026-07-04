import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL } from "./types";
import type { Facility, VisitRecord } from "./types";

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  achieved: boolean;
  progress: string;
}

export function computeBadges(
  facilities: Facility[],
  visits: Record<string, VisitRecord>,
): Badge[] {
  const visitedCount = facilities.filter((f) => visits[f.id]).length;
  const total = facilities.length;

  const milestones: [number, string, string][] = [
    [1, "🎉", "はじめてのポン"],
    [5, "🌱", "おでかけビギナー"],
    [10, "🚃", "ミュージアム通"],
    [20, "🔥", "関東めぐりの達人"],
    [30, "👑", "スタンプマスター"],
  ];

  const badges: Badge[] = milestones.map(([n, emoji, name]) => ({
    id: `count-${n}`,
    emoji,
    name,
    description: `${n}館を訪問する`,
    achieved: visitedCount >= n,
    progress: `${Math.min(visitedCount, n)} / ${n}`,
  }));

  badges.push({
    id: "complete-all",
    emoji: "🏆",
    name: "全館制覇",
    description: "すべての施設を訪問する",
    achieved: total > 0 && visitedCount === total,
    progress: `${visitedCount} / ${total}`,
  });

  for (const cat of CATEGORIES) {
    const inCat = facilities.filter((f) => f.category === cat);
    const done = inCat.filter((f) => visits[f.id]).length;
    badges.push({
      id: `complete-${cat}`,
      emoji: CATEGORY_EMOJI[cat],
      name: `${CATEGORY_LABEL[cat]}コンプリート`,
      description: `${CATEGORY_LABEL[cat]}をすべて訪問する`,
      achieved: inCat.length > 0 && done === inCat.length,
      progress: `${done} / ${inCat.length}`,
    });
  }

  const prefs = new Set(
    facilities.filter((f) => visits[f.id]).map((f) => f.pref),
  );
  badges.push({
    id: "pref-4",
    emoji: "🗾",
    name: "エリアトラベラー",
    description: "4つ以上の都県でスタンプを押す",
    achieved: prefs.size >= 4,
    progress: `${Math.min(prefs.size, 4)} / 4`,
  });

  return badges;
}

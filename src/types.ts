export type Category = "aquarium" | "art" | "museum";

// 1: 全国区の目的地 / 2: 地域の主要館 / 3: 小規模・ニッチ
export type Tier = 1 | 2 | 3;

export interface Facility {
  id: string;
  name: string;
  category: Category;
  pref: string;
  address?: string;
  station?: string;
  lat?: number;
  lng?: number;
  url?: string;
  custom?: boolean;
  tier?: Tier;
  description?: string;
}

// 特別展・企画展。scripts/fetch-exhibitions.ts が生成する exhibitions.json の1件分
export interface Exhibition {
  facilityId: string;
  title: string;
  // 展覧会の詳細ページ(専用サイト > 施設内特設ページ)
  url: string;
  // ポスター・キービジュアル画像(取得できなかった場合は undefined)
  imageUrl?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface ExhibitionData {
  updatedAt: string; // YYYY-MM-DD
  exhibitions: Exhibition[];
}

export interface VisitRecord {
  date: string; // YYYY-MM-DD
  memo: string;
}

export interface HomePoint {
  lat: number;
  lng: number;
}

export interface StoreData {
  visits: Record<string, VisitRecord>;
  custom: Facility[];
  hidden: string[];
  home: HomePoint | null;
  rangeKm: number | null;
}

export const RANGE_OPTIONS = [30, 50, 100];

// 基準地点を設定したときの初期絞り込み距離
export const DEFAULT_RANGE_KM = 50;

export const CATEGORY_LABEL: Record<Category, string> = {
  aquarium: "水族館",
  art: "美術館",
  museum: "博物・科学館",
};

export const CATEGORY_CODE: Record<Category, string> = {
  aquarium: "AQ",
  art: "ART",
  museum: "MUS",
};

export const CATEGORIES: Category[] = ["aquarium", "art", "museum"];

export const TIERS: Tier[] = [1, 2, 3];

export const TIER_LABEL: Record<Tier, string> = {
  1: "MAJOR",
  2: "BASIC",
  3: "LOCAL",
};

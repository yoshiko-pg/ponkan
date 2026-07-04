export type Category = "aquarium" | "art" | "museum" | "science";

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
  museum: "博物館",
  science: "科学館",
};

export const CATEGORY_CODE: Record<Category, string> = {
  aquarium: "AQ",
  art: "ART",
  museum: "MUS",
  science: "SCI",
};

export const CATEGORIES: Category[] = ["aquarium", "art", "museum", "science"];

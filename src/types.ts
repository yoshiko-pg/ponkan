export type Category = "aquarium" | "art" | "museum" | "science";

export interface Facility {
  id: string;
  name: string;
  category: Category;
  pref: string;
  lat?: number;
  lng?: number;
  url?: string;
  custom?: boolean;
}

export interface VisitRecord {
  date: string; // YYYY-MM-DD
  memo: string;
}

export interface StoreData {
  visits: Record<string, VisitRecord>;
  custom: Facility[];
  hidden: string[];
}

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

export const CATEGORY_EMOJI: Record<Category, string> = {
  aquarium: "🐠",
  art: "🎨",
  museum: "🏛️",
  science: "🔭",
};

export const CATEGORIES: Category[] = ["aquarium", "art", "museum", "science"];

import type { Facility } from "./types";

// 8地方区分(北→南)。三重県は近畿、山梨・長野・新潟は中部に含める
export type Region =
  | "hokkaido"
  | "tohoku"
  | "kanto"
  | "chubu"
  | "kinki"
  | "chugoku"
  | "shikoku"
  | "kyushu";

export const REGIONS: { id: Region; label: string; prefs: string[] }[] = [
  { id: "hokkaido", label: "北海道", prefs: ["北海道"] },
  {
    id: "tohoku",
    label: "東北",
    prefs: ["青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県"],
  },
  {
    id: "kanto",
    label: "関東",
    prefs: [
      "茨城県",
      "栃木県",
      "群馬県",
      "埼玉県",
      "千葉県",
      "東京都",
      "神奈川県",
    ],
  },
  {
    id: "chubu",
    label: "中部",
    prefs: [
      "新潟県",
      "富山県",
      "石川県",
      "福井県",
      "山梨県",
      "長野県",
      "岐阜県",
      "静岡県",
      "愛知県",
    ],
  },
  {
    id: "kinki",
    label: "近畿",
    prefs: [
      "三重県",
      "滋賀県",
      "京都府",
      "大阪府",
      "兵庫県",
      "奈良県",
      "和歌山県",
    ],
  },
  {
    id: "chugoku",
    label: "中国",
    prefs: ["鳥取県", "島根県", "岡山県", "広島県", "山口県"],
  },
  {
    id: "shikoku",
    label: "四国",
    prefs: ["徳島県", "香川県", "愛媛県", "高知県"],
  },
  {
    id: "kyushu",
    label: "九州・沖縄",
    prefs: [
      "福岡県",
      "佐賀県",
      "長崎県",
      "熊本県",
      "大分県",
      "宮崎県",
      "鹿児島県",
      "沖縄県",
    ],
  },
];

// エリア絞り込みの値。地方ID("kinki")か都道府県名("京都府")。null は全国
export type Area = string;

const REGION_BY_ID = new Map(REGIONS.map((r) => [r.id as string, r]));
const ALL_PREFS = new Set(REGIONS.flatMap((r) => r.prefs));

export function isArea(value: unknown): value is Area {
  return (
    typeof value === "string" &&
    (REGION_BY_ID.has(value) || ALL_PREFS.has(value))
  );
}

// 1つの都道府県だけに絞り込んでいるか(北海道は地方=都道府県)
export function isSinglePrefArea(area: Area | null): boolean {
  if (area == null) return false;
  return ALL_PREFS.has(area) || REGION_BY_ID.get(area)?.prefs.length === 1;
}

export function matchesArea(f: Facility, area: Area | null): boolean {
  if (area == null) return true;
  const region = REGION_BY_ID.get(area);
  return region ? region.prefs.includes(f.pref) : f.pref === area;
}

export function areaLabel(area: Area | null): string {
  if (area == null) return "全国";
  return REGION_BY_ID.get(area)?.label ?? area;
}

// "京都府" → "京都"、"北海道" はそのまま(スタンプ下の小さな表示用)
export function shortPref(pref: string): string {
  return pref === "北海道" ? pref : pref.replace(/[都府県]$/, "");
}

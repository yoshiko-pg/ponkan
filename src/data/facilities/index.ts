import { AQUARIUM_TIER1 } from "./aquarium-tier1";
import { AQUARIUM_TIER2 } from "./aquarium-tier2";
import { AQUARIUM_TIER3 } from "./aquarium-tier3";
import { ART_TIER1 } from "./art-tier1";
import { ART_TIER2 } from "./art-tier2";
import { ART_TIER3 } from "./art-tier3";
import { MUSEUM_TIER1 } from "./museum-tier1";
import { MUSEUM_TIER2 } from "./museum-tier2";
import { MUSEUM_TIER3 } from "./museum-tier3";
import { SCIENCE_TIER1 } from "./science-tier1";
import { SCIENCE_TIER2 } from "./science-tier2";
import { SCIENCE_TIER3 } from "./science-tier3";

import type { Facility } from "../../types";

// 座標・住所はおおよその値。カテゴリ・tier別の各ファイルを直接編集して調整できます。
export const SEED_FACILITIES: Facility[] = [
  ...AQUARIUM_TIER1,
  ...AQUARIUM_TIER2,
  ...AQUARIUM_TIER3,
  ...ART_TIER1,
  ...ART_TIER2,
  ...ART_TIER3,
  ...MUSEUM_TIER1,
  ...MUSEUM_TIER2,
  ...MUSEUM_TIER3,
  ...SCIENCE_TIER1,
  ...SCIENCE_TIER2,
  ...SCIENCE_TIER3,
];

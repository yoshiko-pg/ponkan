import type { Facility } from "../../types";

// 水族館 / Tier 2 (BASIC)
export const AQUARIUM_TIER2: Facility[] = [
  {
    id: "sumida-aquarium",
    name: "すみだ水族館",
    category: "aquarium",
    tier: 2,
    pref: "東京都",
    address: "東京都墨田区押上1-1-2 東京スカイツリータウン・ソラマチ5F",
    station: "とうきょうスカイツリー駅 / 押上駅",
    lat: 35.7101,
    lng: 139.8107,
    url: "https://www.sumida-aquarium.com/",
  },
  {
    id: "sunshine-aquarium",
    name: "サンシャイン水族館",
    category: "aquarium",
    tier: 2,
    pref: "東京都",
    address:
      "東京都豊島区東池袋3-1 サンシャインシティ ワールドインポートマートビル屋上",
    station: "東池袋駅 / 池袋駅",
    lat: 35.7288,
    lng: 139.718,
    url: "https://sunshinecity.jp/aquarium/",
  },
  {
    id: "shinagawa-aquarium",
    name: "しながわ水族館",
    category: "aquarium",
    tier: 2,
    pref: "東京都",
    address: "東京都品川区勝島3-2-1 しながわ区民公園内",
    station: "大森海岸駅(京急線)",
    lat: 35.5876,
    lng: 139.7362,
    url: "https://www.aquarium.gr.jp/",
  },
  {
    id: "kawasui",
    name: "カワスイ 川崎水族館",
    category: "aquarium",
    tier: 2,
    pref: "神奈川県",
    address: "神奈川県川崎市川崎区日進町1-11 川崎ルフロン9・10F",
    station: "川崎駅 / 京急川崎駅",
    lat: 35.5312,
    lng: 139.6979,
    url: "https://kawa-sui.com/",
  },
];

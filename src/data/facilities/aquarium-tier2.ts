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
    description:
      "東京スカイツリータウン内にある完全屋内型の水族館。ペンギンやチンアナゴ、クラゲ、小笠原大水槽などを近い距離で楽しめる。",
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
    description:
      "サンシャインシティ屋上にある都市型水族館。頭上を泳ぐように見える「天空のペンギン」など、空中感のある展示が特徴。",
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
    description:
      "しながわ区民公園内にある親しみやすい水族館。海中にいるようなトンネル水槽や、イルカ・アシカ・アザラシのショーが楽しめる。",
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
    description:
      "川崎駅近くの商業施設内にある水族館。多摩川から南米・アフリカなど世界各地の水辺まで、環境ごとの生態系を再現している。",
  },
];
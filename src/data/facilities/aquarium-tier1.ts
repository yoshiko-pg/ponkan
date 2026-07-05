import type { Facility } from "../../types";

// 水族館 / Tier 1 (MAJOR)
export const AQUARIUM_TIER1: Facility[] = [
  {
    id: "kasai-rinkai",
    name: "葛西臨海水族園",
    category: "aquarium",
    tier: 1,
    pref: "東京都",
    address: "東京都江戸川区臨海町6-2-3",
    station: "葛西臨海公園駅(JR京葉線)",
    lat: 35.6398,
    lng: 139.863,
    url: "https://www.tokyo-zoo.net/zoo/kasai/",
    description:
      "葛西臨海公園内にある大型水族館。クロマグロが群泳する大水槽や、国内最大級のペンギン展示が見どころ。",
  },
  {
    id: "aqua-park-shinagawa",
    name: "マクセル アクアパーク品川",
    category: "aquarium",
    tier: 1,
    pref: "東京都",
    address: "東京都港区高輪4-10-30 品川プリンスホテル内",
    station: "品川駅",
    lat: 35.6277,
    lng: 139.7367,
    url: "https://www.aqua-park.jp/",
    description:
      "品川駅近くの都市型水族館。光・音・水の演出とイルカが共演するドルフィンパフォーマンスが人気。",
  },
  {
    id: "hakkeijima",
    name: "横浜・八景島シーパラダイス",
    category: "aquarium",
    tier: 1,
    pref: "神奈川県",
    address: "神奈川県横浜市金沢区八景島",
    station: "八景島駅(シーサイドライン)",
    lat: 35.3379,
    lng: 139.6469,
    url: "https://www.seaparadise.co.jp/",
    description:
      "4つの水族館とアトラクション、レストランなどを備えた複合型海洋レジャー施設。1日過ごしやすい規模感が魅力。",
  },
  {
    id: "enosui",
    name: "新江ノ島水族館",
    category: "aquarium",
    tier: 1,
    pref: "神奈川県",
    address: "神奈川県藤沢市片瀬海岸2-19-1",
    station: "片瀬江ノ島駅(小田急線)",
    lat: 35.3103,
    lng: 139.4785,
    url: "https://www.enosui.com/",
    description:
      "相模湾をテーマにした展示が充実した江の島近くの水族館。相模湾大水槽やクラゲ展示が代表的。",
  },
  {
    id: "kamogawa-seaworld",
    name: "鴨川シーワールド",
    category: "aquarium",
    tier: 1,
    pref: "千葉県",
    address: "千葉県鴨川市東町1464-18",
    station: "安房鴨川駅(JR外房線)から無料送迎バス",
    lat: 35.114,
    lng: 140.1148,
    url: "https://www.kamogawa-seaworld.jp/",
    description:
      "太平洋を望む水族館テーマパーク。シャチ、イルカ、ベルーガ、アシカなどのパフォーマンスが大きな見どころ。",
  },
  {
    id: "aquaworld-oarai",
    name: "アクアワールド茨城県大洗水族館",
    category: "aquarium",
    tier: 1,
    pref: "茨城県",
    address: "茨城県東茨城郡大洗町磯浜町8252-3",
    station: "大洗駅(鹿島臨海鉄道)からバス",
    lat: 36.3186,
    lng: 140.5766,
    url: "https://www.aquaworld-oarai.com/",
    description:
      "関東有数の大型水族館。サメの飼育・研究に力を入れており、多種多様なサメ展示や大水槽が楽しめる。",
  },
];
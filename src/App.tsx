import { useEffect, useState } from "react";
import { useStore } from "./store";
import { useTheme } from "./useTheme";
import exhibitionData from "./data/exhibitions.json";
import { toDateString } from "./format";
import { isArea } from "./area";
import type { Area } from "./area";
import type { ExhibitionData, Facility } from "./types";
import { StampBook } from "./components/StampBook";
import { MapView } from "./components/MapView";
import { Exhibitions } from "./components/Exhibitions";
import { Sidebar } from "./components/Sidebar";
import { FacilityDetail } from "./components/FacilityDetail";
import type { Category, Tier } from "./types";

type Tab = "book" | "map" | "expo";

const EXHIBITIONS = (exhibitionData as ExhibitionData).exhibitions;

const FILTER_KEY = "ponkan:filter";
const TIER_FILTER_KEY = "ponkan:tierFilter";
const AREA_KEY = "ponkan:area";
const CATEGORIES: Category[] = ["aquarium", "art", "museum"];
const TIERS: Tier[] = [1, 2, 3];

// 直近の絞り込みを復元する(不正値は無視)。距離(rangeKm)は store 側で永続化される
function loadFilter(): Category[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is Category => CATEGORIES.includes(c));
  } catch {
    return [];
  }
}

function loadTierFilter(): Tier[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(TIER_FILTER_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t): t is Tier => TIERS.includes(t));
  } catch {
    return [];
  }
}

// 地方ID("kinki")か都道府県名。未選択(全国)は保存しない
function loadArea(): Area | null {
  const saved = localStorage.getItem(AREA_KEY);
  return isArea(saved) ? saved : null;
}

export default function App() {
  const store = useStore();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("book");
  const [filter, setFilter] = useState<Category[]>(loadFilter);
  const [tierFilter, setTierFilter] = useState<Tier[]>(loadTierFilter);
  const [area, setArea] = useState<Area | null>(loadArea);

  // カテゴリ・Tier・エリアの絞り込みが変わるたびに保存する
  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
  }, [filter]);
  useEffect(() => {
    localStorage.setItem(TIER_FILTER_KEY, JSON.stringify(tierFilter));
  }, [tierFilter]);
  useEffect(() => {
    if (area) localStorage.setItem(AREA_KEY, area);
    else localStorage.removeItem(AREA_KEY);
  }, [area]);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingHome, setPickingHome] = useState(false);

  // 選択中の施設が削除された場合に備えて最新の参照を取り直す
  const selectedFacility = selected
    ? (store.facilities.find((f) => f.id === selected.id) ?? null)
    : null;

  // ブックマークした特別展が2週間以内に終了するときはEXHIBITSタブで知らせる
  const today = toDateString(new Date());
  const soonLimit = toDateString(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  );
  const bookmarkEndingSoon = EXHIBITIONS.some(
    (ex) =>
      store.expoBookmarks.includes(ex.url) &&
      ex.endDate != null &&
      ex.endDate >= today &&
      ex.endDate <= soonLimit,
  );

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">
          PONKAN
          <span className="logo-dot" />
        </h1>
        <button
          type="button"
          className="icon-btn"
          onClick={() => setMenuOpen(true)}
          aria-label="メニューを開く"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
      </header>

      <main className="content">
        {tab === "book" && (
          <StampBook
            store={store}
            filter={filter}
            onFilterChange={setFilter}
            tierFilter={tierFilter}
            onTierFilterChange={setTierFilter}
            area={area}
            onAreaChange={setArea}
            onPickOnMap={() => {
              setTab("map");
              setPickingHome(true);
            }}
            onSelect={setSelected}
          />
        )}
        {tab === "map" && (
          <MapView
            store={store}
            theme={theme}
            filter={filter}
            onFilterChange={setFilter}
            tierFilter={tierFilter}
            onTierFilterChange={setTierFilter}
            area={area}
            onAreaChange={setArea}
            picking={pickingHome}
            onPickPoint={(lat, lng) => {
              store.setHome({ lat, lng });
              setPickingHome(false);
            }}
            onCancelPick={() => setPickingHome(false)}
            onSelect={setSelected}
          />
        )}
        {tab === "expo" && (
          <Exhibitions
            store={store}
            area={area}
            onAreaChange={setArea}
            onSelect={setSelected}
          />
        )}
      </main>

      <nav className="tabbar">
        <button
          type="button"
          className={tab === "book" ? "active" : ""}
          onClick={() => setTab("book")}
        >
          STAMPS
        </button>
        <button
          type="button"
          className={tab === "map" ? "active" : ""}
          onClick={() => setTab("map")}
        >
          MAP
        </button>
        <button
          type="button"
          className={tab === "expo" ? "active" : ""}
          onClick={() => setTab("expo")}
        >
          EXHIBITS
          {bookmarkEndingSoon && (
            <span
              className="tab-dot"
              aria-label="ブックマークした特別展がまもなく終了"
            />
          )}
        </button>
      </nav>

      {menuOpen && (
        <Sidebar
          store={store}
          theme={theme}
          onToggleTheme={toggle}
          onPickOnMap={() => {
            setMenuOpen(false);
            setTab("map");
            setPickingHome(true);
          }}
          onClose={() => setMenuOpen(false)}
        />
      )}
      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          store={store}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

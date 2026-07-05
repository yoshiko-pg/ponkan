import { useEffect, useState } from "react";
import { useStore } from "./store";
import { useTheme } from "./useTheme";
import type { Facility } from "./types";
import { StampBook } from "./components/StampBook";
import { MapView } from "./components/MapView";
import { Exhibitions } from "./components/Exhibitions";
import { Sidebar } from "./components/Sidebar";
import { FacilityDetail } from "./components/FacilityDetail";
import type { Category, Tier } from "./types";

type Tab = "book" | "map" | "expo";

const FILTER_KEY = "ponkan:filter";
const CATEGORIES: Category[] = ["aquarium", "art", "museum", "science"];

// 直近のカテゴリ絞り込みを復元する(不正値は無視)
function loadFilter(): Category[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(FILTER_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is Category => CATEGORIES.includes(c));
  } catch {
    return [];
  }
}

export default function App() {
  const store = useStore();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("book");
  const [filter, setFilter] = useState<Category[]>(loadFilter);
  const [tierFilter, setTierFilter] = useState<Tier[]>([]);

  // カテゴリ絞り込みが変わるたびに保存する
  useEffect(() => {
    localStorage.setItem(FILTER_KEY, JSON.stringify(filter));
  }, [filter]);
  const [selected, setSelected] = useState<Facility | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingHome, setPickingHome] = useState(false);

  // 選択中の施設が削除された場合に備えて最新の参照を取り直す
  const selectedFacility = selected
    ? (store.facilities.find((f) => f.id === selected.id) ?? null)
    : null;

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
            picking={pickingHome}
            onPickPoint={(lat, lng) => {
              store.setHome({ lat, lng });
              setPickingHome(false);
            }}
            onCancelPick={() => setPickingHome(false)}
            onSelect={setSelected}
          />
        )}
        {tab === "expo" && <Exhibitions store={store} />}
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

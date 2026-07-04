import { useState } from "react";
import { useStore } from "./store";
import { useTheme } from "./useTheme";
import type { Facility } from "./types";
import { StampBook } from "./components/StampBook";
import { MapView } from "./components/MapView";
import { Sidebar } from "./components/Sidebar";
import { FacilityDetail } from "./components/FacilityDetail";

type Tab = "book" | "map";

export default function App() {
  const store = useStore();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("book");
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
        <span className="header-sub">MUSEUM STAMP RALLY</span>
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
        {tab === "book" && <StampBook store={store} onSelect={setSelected} />}
        {tab === "map" && (
          <MapView
            store={store}
            theme={theme}
            picking={pickingHome}
            onPickPoint={(lat, lng) => {
              store.setHome({ lat, lng });
              setPickingHome(false);
            }}
            onCancelPick={() => setPickingHome(false)}
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

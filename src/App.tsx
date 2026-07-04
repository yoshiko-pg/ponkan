import { useState } from "react";
import { useStore } from "./store";
import { useTheme } from "./useTheme";
import type { Facility } from "./types";
import { StampBook } from "./components/StampBook";
import { MapView } from "./components/MapView";
import { Achievements } from "./components/Achievements";
import { FacilityDetail } from "./components/FacilityDetail";

type Tab = "book" | "map" | "badges";

export default function App() {
  const store = useStore();
  const { theme, toggle } = useTheme();
  const [tab, setTab] = useState<Tab>("book");
  const [selected, setSelected] = useState<Facility | null>(null);

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
          className="theme-toggle"
          onClick={toggle}
          aria-label={
            theme === "dark"
              ? "ライトモードに切り替え"
              : "ダークモードに切り替え"
          }
        >
          {theme === "dark" ? (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
            </svg>
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </header>

      <main className="content">
        {tab === "book" && <StampBook store={store} onSelect={setSelected} />}
        {tab === "map" && (
          <MapView store={store} theme={theme} onSelect={setSelected} />
        )}
        {tab === "badges" && <Achievements store={store} />}
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
          className={tab === "badges" ? "active" : ""}
          onClick={() => setTab("badges")}
        >
          AWARDS
        </button>
      </nav>

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

import { useState } from "react";
import { useStore } from "./store";
import type { Facility } from "./types";
import { StampBook } from "./components/StampBook";
import { MapView } from "./components/MapView";
import { Achievements } from "./components/Achievements";
import { FacilityDetail } from "./components/FacilityDetail";
import { AddFacility } from "./components/AddFacility";

type Tab = "book" | "map" | "badges";

export default function App() {
  const store = useStore();
  const [tab, setTab] = useState<Tab>("book");
  const [selected, setSelected] = useState<Facility | null>(null);
  const [adding, setAdding] = useState(false);

  const total = store.facilities.length;
  const visited = store.facilities.filter((f) => store.visits[f.id]).length;
  const pct = total > 0 ? Math.round((visited / total) * 100) : 0;

  // 選択中の施設が削除された場合に備えて最新の参照を取り直す
  const selectedFacility = selected
    ? (store.facilities.find((f) => f.id === selected.id) ?? null)
    : null;

  return (
    <div className="app">
      <header className="header">
        <div className="header-row">
          <h1>
            ぽんかん <span className="header-sub">ミュージアムスタンプ帳</span>
          </h1>
          <span className="header-count">
            {visited} <small>/ {total} 館</small>
          </span>
        </div>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </header>

      <main className="content">
        {tab === "book" && (
          <StampBook
            store={store}
            onSelect={setSelected}
            onAdd={() => setAdding(true)}
          />
        )}
        {tab === "map" && <MapView store={store} onSelect={setSelected} />}
        {tab === "badges" && <Achievements store={store} />}
      </main>

      <nav className="tabbar">
        <button
          type="button"
          className={tab === "book" ? "active" : ""}
          onClick={() => setTab("book")}
        >
          📖 スタンプ帳
        </button>
        <button
          type="button"
          className={tab === "map" ? "active" : ""}
          onClick={() => setTab("map")}
        >
          🗺️ マップ
        </button>
        <button
          type="button"
          className={tab === "badges" ? "active" : ""}
          onClick={() => setTab("badges")}
        >
          🏆 実績
        </button>
      </nav>

      {selectedFacility && (
        <FacilityDetail
          facility={selectedFacility}
          store={store}
          onClose={() => setSelected(null)}
        />
      )}
      {adding && <AddFacility store={store} onClose={() => setAdding(false)} />}
    </div>
  );
}

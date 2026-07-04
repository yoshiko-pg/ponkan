import { useState } from "react";
import { CATEGORIES, CATEGORY_LABEL } from "../types";
import type { Category, Facility } from "../types";
import type { Store } from "../store";
import { StampCircle } from "./StampCircle";

interface Props {
  store: Store;
  onSelect: (f: Facility) => void;
}

export function StampBook({ store, onSelect }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");

  const shown = store.facilities.filter(
    (f) => filter === "all" || f.category === filter,
  );
  const visited = shown.filter((f) => store.visits[f.id]).length;
  const pct = shown.length > 0 ? Math.round((visited / shown.length) * 100) : 0;

  return (
    <div className="stamp-book">
      <div className="book-head">
        <div className="chips">
          <button
            type="button"
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            ALL
          </button>
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              className={`chip chip-${cat} ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              <i className="dot" />
              {CATEGORY_LABEL[cat]}
            </button>
          ))}
        </div>

        <div className="count-row">
          <span className="count-label">
            {filter === "all" ? "ALL SPOTS" : CATEGORY_LABEL[filter]}
          </span>
          <span className="count-num">
            {visited}
            <small> / {shown.length}</small>
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${filter !== "all" ? `fill-${filter}` : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="stamp-grid">
        {shown.map((f) => (
          <StampCircle
            key={f.id}
            facility={f}
            visit={store.visits[f.id]}
            onClick={() => onSelect(f)}
          />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="empty-note">このカテゴリの施設はまだありません</p>
      )}
    </div>
  );
}

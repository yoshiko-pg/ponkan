import { useState } from "react";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL } from "../types";
import type { Category, Facility } from "../types";
import type { Store } from "../store";
import { StampCircle } from "./StampCircle";

interface Props {
  store: Store;
  onSelect: (f: Facility) => void;
  onAdd: () => void;
}

export function StampBook({ store, onSelect, onAdd }: Props) {
  const [filter, setFilter] = useState<Category | "all">("all");

  const shown = store.facilities.filter(
    (f) => filter === "all" || f.category === filter,
  );

  return (
    <div className="stamp-book">
      <div className="chips">
        <button
          type="button"
          className={`chip ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          すべて
        </button>
        {CATEGORIES.map((cat) => (
          <button
            type="button"
            key={cat}
            className={`chip chip-${cat} ${filter === cat ? "active" : ""}`}
            onClick={() => setFilter(cat)}
          >
            {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
          </button>
        ))}
        <button type="button" className="chip chip-add" onClick={onAdd}>
          ＋ 追加
        </button>
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

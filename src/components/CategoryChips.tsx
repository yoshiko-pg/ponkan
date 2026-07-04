import { CATEGORIES, CATEGORY_LABEL } from "../types";
import type { Category } from "../types";

export type CategoryFilter = Category | "all";

interface Props {
  filter: CategoryFilter;
  onChange: (filter: CategoryFilter) => void;
}

export function CategoryChips({ filter, onChange }: Props) {
  return (
    <div className="chips">
      <button
        type="button"
        className={`chip ${filter === "all" ? "active" : ""}`}
        onClick={() => onChange("all")}
      >
        ALL
      </button>
      {CATEGORIES.map((cat) => (
        <button
          type="button"
          key={cat}
          className={`chip chip-${cat} ${filter === cat ? "active" : ""}`}
          onClick={() => onChange(cat)}
        >
          <i className="dot" />
          {CATEGORY_LABEL[cat]}
        </button>
      ))}
    </div>
  );
}

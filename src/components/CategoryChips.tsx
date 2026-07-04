import { CATEGORIES, CATEGORY_LABEL } from "../types";
import type { Category } from "../types";

// 複数選択トグル。何も選択されていないときは全カテゴリ表示(ALL)扱い
interface Props {
  selected: Category[];
  onChange: (selected: Category[]) => void;
}

export function CategoryChips({ selected, onChange }: Props) {
  const toggle = (cat: Category) =>
    onChange(
      selected.includes(cat)
        ? selected.filter((c) => c !== cat)
        : [...selected, cat],
    );

  return (
    <div className="chips">
      {CATEGORIES.map((cat) => (
        <button
          type="button"
          key={cat}
          className={`chip chip-${cat} ${selected.includes(cat) ? "active" : ""}`}
          onClick={() => toggle(cat)}
        >
          <i className="dot" />
          {CATEGORY_LABEL[cat]}
        </button>
      ))}
    </div>
  );
}

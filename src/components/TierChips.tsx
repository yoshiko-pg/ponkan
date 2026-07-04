import { TIERS, TIER_LABEL } from "../types";
import type { Tier } from "../types";

// カテゴリと同じ複数選択トグル。何も選択されていないときは全Tier表示扱い
interface Props {
  selected: Tier[];
  onChange: (selected: Tier[]) => void;
}

export function TierChips({ selected, onChange }: Props) {
  const toggle = (tier: Tier) =>
    onChange(
      selected.includes(tier)
        ? selected.filter((t) => t !== tier)
        : [...selected, tier],
    );

  return (
    <div className="chips">
      {TIERS.map((tier) => (
        <button
          type="button"
          key={tier}
          className={`chip chip-tier${tier} ${selected.includes(tier) ? "active" : ""}`}
          onClick={() => toggle(tier)}
        >
          <i className="dot" />
          {TIER_LABEL[tier]}
        </button>
      ))}
    </div>
  );
}

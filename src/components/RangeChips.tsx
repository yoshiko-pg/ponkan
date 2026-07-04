import { RANGE_OPTIONS } from "../types";

// 単一選択トグル。選択中のチップをもう一度押すと解除(=制限なし)
interface Props {
  rangeKm: number | null;
  onChange: (rangeKm: number | null) => void;
}

export function RangeChips({ rangeKm, onChange }: Props) {
  return (
    <div className="chips">
      {RANGE_OPTIONS.map((km) => (
        <button
          type="button"
          key={km}
          className={`chip ${rangeKm === km ? "active" : ""}`}
          onClick={() => onChange(rangeKm === km ? null : km)}
        >
          {km}km以内
        </button>
      ))}
    </div>
  );
}

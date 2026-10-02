import { REGIONS, areaLabel, isArea } from "../area";
import type { Area } from "../area";

// 地方・都道府県の単一選択。チップの見た目のまま、タップで端末ネイティブの選択UIを開く
interface Props {
  area: Area | null;
  onChange: (area: Area | null) => void;
}

export function AreaSelect({ area, onChange }: Props) {
  return (
    <label className={`chip area-chip ${area ? "active" : ""}`}>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
      {areaLabel(area)}
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
      <select
        value={area ?? ""}
        onChange={(e) =>
          onChange(isArea(e.target.value) ? e.target.value : null)
        }
        aria-label="エリアで絞り込む"
      >
        <option value="">全国</option>
        {REGIONS.map((r) =>
          r.prefs.length === 1 ? (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ) : (
            <optgroup key={r.id} label={r.label}>
              <option value={r.id}>{r.label}すべて</option>
              {r.prefs.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </optgroup>
          ),
        )}
      </select>
    </label>
  );
}

import { CATEGORY_LABEL } from "../types";
import type { Facility } from "../types";
import type { Store } from "../store";
import { distanceKm } from "../geo";
import { StampCircle } from "./StampCircle";
import { CategoryChips } from "./CategoryChips";
import type { CategoryFilter } from "./CategoryChips";

interface Props {
  store: Store;
  filter: CategoryFilter;
  onFilterChange: (filter: CategoryFilter) => void;
  onSelect: (f: Facility) => void;
}

export function StampBook({ store, filter, onFilterChange, onSelect }: Props) {
  const { home, rangeKm } = store;

  // 基準地点があれば距離を計算(座標なしの施設は null のまま残す)
  const withDistance = store.facilities.map((f) => ({
    facility: f,
    distance:
      home && f.lat != null && f.lng != null
        ? distanceKm(home, { lat: f.lat, lng: f.lng })
        : null,
  }));

  const shown = withDistance.filter(
    ({ facility, distance }) =>
      (filter === "all" || facility.category === filter) &&
      (rangeKm == null || distance == null || distance <= rangeKm),
  );
  if (home) {
    shown.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  }

  const visited = shown.filter(
    ({ facility }) => store.visits[facility.id],
  ).length;
  const pct = shown.length > 0 ? Math.round((visited / shown.length) * 100) : 0;

  return (
    <div className="stamp-book">
      <div className="book-head">
        <CategoryChips filter={filter} onChange={onFilterChange} />

        <div className="count-row">
          <span className="count-label">
            {filter === "all" ? "ALL SPOTS" : CATEGORY_LABEL[filter]}
            {home && rangeKm != null && ` ・ ${rangeKm}KM圏内`}
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
        {shown.map(({ facility, distance }) => (
          <StampCircle
            key={facility.id}
            facility={facility}
            visit={store.visits[facility.id]}
            distance={distance}
            onClick={() => onSelect(facility)}
          />
        ))}
      </div>
      {shown.length === 0 && (
        <p className="empty-note">条件に合う施設がありません</p>
      )}
    </div>
  );
}

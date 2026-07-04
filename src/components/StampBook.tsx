import { CATEGORIES, CATEGORY_LABEL } from "../types";
import type { Category, Facility } from "../types";
import type { Store } from "../store";
import { distanceKm, requestCurrentLocation } from "../geo";
import { StampCircle } from "./StampCircle";
import { CategoryChips } from "./CategoryChips";

interface Props {
  store: Store;
  filter: Category[];
  onFilterChange: (filter: Category[]) => void;
  onPickOnMap: () => void;
  onSelect: (f: Facility) => void;
}

export function StampBook({
  store,
  filter,
  onFilterChange,
  onPickOnMap,
  onSelect,
}: Props) {
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
      (filter.length === 0 || filter.includes(facility.category)) &&
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
        <CategoryChips selected={filter} onChange={onFilterChange} />

        <div className="count-row">
          <span className="count-label">
            {filter.length === 0
              ? "ALL SPOTS"
              : CATEGORIES.filter((c) => filter.includes(c))
                  .map((c) => CATEGORY_LABEL[c])
                  .join("・")}
            {home && rangeKm != null && ` ・ ${rangeKm}KM圏内`}
          </span>
          <span className="count-num">
            {visited}
            <small> / {shown.length}</small>
          </span>
        </div>
        <div className="progress-track">
          <div
            className={`progress-fill ${filter.length === 1 ? `fill-${filter[0]}` : ""}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {!home && (
        <div className="home-prompt">
          <p className="home-prompt-text">
            自宅などの基準地点を登録すると、一覧を距離で絞り込み・近い順に並べられます。
          </p>
          <div className="data-actions">
            <button
              type="button"
              onClick={() => requestCurrentLocation(store.setHome)}
            >
              現在地を使う
            </button>
            <button type="button" onClick={onPickOnMap}>
              地図で選ぶ
            </button>
          </div>
        </div>
      )}

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

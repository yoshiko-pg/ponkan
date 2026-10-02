import { CATEGORIES, CATEGORY_LABEL, TIERS, TIER_LABEL } from "../types";
import type { Category, Facility, Tier } from "../types";
import type { Store } from "../store";
import { distanceKm, requestCurrentLocation } from "../geo";
import { areaLabel, isSinglePrefArea, matchesArea, shortPref } from "../area";
import type { Area } from "../area";
import { StampCircle } from "./StampCircle";
import { CategoryChips } from "./CategoryChips";
import { TierChips } from "./TierChips";
import { AreaSelect } from "./AreaSelect";
import { RangeChips } from "./RangeChips";

interface Props {
  store: Store;
  filter: Category[];
  onFilterChange: (filter: Category[]) => void;
  tierFilter: Tier[];
  onTierFilterChange: (tierFilter: Tier[]) => void;
  area: Area | null;
  onAreaChange: (area: Area | null) => void;
  onPickOnMap: () => void;
  onSelect: (f: Facility) => void;
}

export function StampBook({
  store,
  filter,
  onFilterChange,
  tierFilter,
  onTierFilterChange,
  area,
  onAreaChange,
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

  // Tierで絞り込むときは未分類(カスタム追加分)は表示しない
  const matched = withDistance.filter(
    ({ facility }) =>
      (filter.length === 0 || filter.includes(facility.category)) &&
      (tierFilter.length === 0 ||
        (facility.tier != null && tierFilter.includes(facility.tier))) &&
      matchesArea(facility, area),
  );
  const shown = matched.filter(
    ({ distance }) =>
      rangeKm == null || distance == null || distance <= rangeKm,
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
        <TierChips selected={tierFilter} onChange={onTierFilterChange} />
        <div className="chips">
          <AreaSelect area={area} onChange={onAreaChange} />
          {home && <RangeChips rangeKm={rangeKm} onChange={store.setRangeKm} />}
        </div>

        <div className="count-row">
          <span className="count-label">
            {(() => {
              // 全選択は絞り込みなしと同じなので条件として表示しない
              const conds = [
                ...(area != null ? [areaLabel(area)] : []),
                ...(filter.length > 0 && filter.length < CATEGORIES.length
                  ? CATEGORIES.filter((c) => filter.includes(c)).map(
                      (c) => CATEGORY_LABEL[c],
                    )
                  : []),
                ...(tierFilter.length > 0 && tierFilter.length < TIERS.length
                  ? TIERS.filter((t) => tierFilter.includes(t)).map(
                      (t) => TIER_LABEL[t],
                    )
                  : []),
              ];
              const label = conds.length === 0 ? "ALL SPOTS" : conds.join("・");
              return home && rangeKm != null ? `${label}・${rangeKm}KM` : label;
            })()}
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
            // 距離がないときは場所の手がかりとして都道府県を出す(1県に絞り込み中は不要)
            pref={isSinglePrefArea(area) ? undefined : shortPref(facility.pref)}
            onClick={() => onSelect(facility)}
          />
        ))}
      </div>
      {shown.length === 0 &&
        (matched.length > 0 && rangeKm != null ? (
          // 旅行先のエリアを選んだときなど、距離の絞り込みだけで0件になっている
          <div className="empty-note">
            <p>
              {rangeKm}km以内に条件に合う施設がありません
              <br />
              (圏外に{matched.length}館あります)
            </p>
            <button
              type="button"
              className="btn-subtle"
              onClick={() => store.setRangeKm(null)}
            >
              距離の絞り込みを解除
            </button>
          </div>
        ) : (
          <p className="empty-note">条件に合う施設がありません</p>
        ))}
    </div>
  );
}

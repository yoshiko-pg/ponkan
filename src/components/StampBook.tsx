import { useEffect, useState } from "react";
import { CATEGORIES, CATEGORY_LABEL, TIERS, TIER_LABEL } from "../types";
import type { Category, Facility, Tier } from "../types";
import type { Store } from "../store";
import { distanceKm, requestCurrentLocation } from "../geo";
import { StampCircle } from "./StampCircle";
import { CategoryChips } from "./CategoryChips";
import { TierChips } from "./TierChips";
import { RangeChips } from "./RangeChips";

// 訪問状態での絞り込み。null は絞り込みなし
type VisitFilter = "unvisited" | "visited" | null;

const VISIT_FILTER_KEY = "ponkan:visitFilter";

function loadVisitFilter(): VisitFilter {
  const v = localStorage.getItem(VISIT_FILTER_KEY);
  return v === "unvisited" || v === "visited" ? v : null;
}

// 検索用の正規化: 全半角・大文字小文字・空白の揺れを吸収し、ひらがなはカタカナに寄せる
function normalizeForSearch(s: string): string {
  return s
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

interface Props {
  store: Store;
  filter: Category[];
  onFilterChange: (filter: Category[]) => void;
  tierFilter: Tier[];
  onTierFilterChange: (tierFilter: Tier[]) => void;
  onPickOnMap: () => void;
  onSelect: (f: Facility) => void;
}

export function StampBook({
  store,
  filter,
  onFilterChange,
  tierFilter,
  onTierFilterChange,
  onPickOnMap,
  onSelect,
}: Props) {
  const { home, rangeKm } = store;
  const [visitFilter, setVisitFilter] = useState<VisitFilter>(loadVisitFilter);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (visitFilter) localStorage.setItem(VISIT_FILTER_KEY, visitFilter);
    else localStorage.removeItem(VISIT_FILTER_KEY);
  }, [visitFilter]);

  // 基準地点があれば距離を計算(座標なしの施設は null のまま残す)
  const withDistance = store.facilities.map((f) => ({
    facility: f,
    distance:
      home && f.lat != null && f.lng != null
        ? distanceKm(home, { lat: f.lat, lng: f.lng })
        : null,
  }));

  // Tierで絞り込むときは未分類(カスタム追加分)は表示しない
  const q = normalizeForSearch(query);
  const shown = withDistance.filter(
    ({ facility, distance }) =>
      (filter.length === 0 || filter.includes(facility.category)) &&
      (tierFilter.length === 0 ||
        (facility.tier != null && tierFilter.includes(facility.tier))) &&
      (rangeKm == null || distance == null || distance <= rangeKm) &&
      (visitFilter == null ||
        (visitFilter === "visited") === Boolean(store.visits[facility.id])) &&
      (q === "" || normalizeForSearch(facility.name).includes(q)),
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
        {home && <RangeChips rangeKm={rangeKm} onChange={store.setRangeKm} />}

        <div className="chips">
          {(["unvisited", "visited"] as const).map((v) => (
            <button
              type="button"
              key={v}
              className={`chip ${visitFilter === v ? "active" : ""}`}
              onClick={() => setVisitFilter(visitFilter === v ? null : v)}
            >
              {v === "unvisited" ? "未訪問" : "訪問済み"}
            </button>
          ))}
          <input
            className="book-search"
            type="search"
            placeholder="施設名でさがす"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="施設名で検索"
          />
        </div>

        <div className="count-row">
          <span className="count-label">
            {(() => {
              // 全選択は絞り込みなしと同じなので条件として表示しない
              const conds = [
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
                ...(visitFilter
                  ? [visitFilter === "visited" ? "訪問済み" : "未訪問"]
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

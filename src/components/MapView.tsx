import { useEffect, useRef } from "react";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { divIcon, latLngBounds } from "leaflet";
import type { DivIcon, FitBoundsOptions, LatLngBounds } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CODE, CATEGORY_LABEL, DEFAULT_RANGE_KM } from "../types";
import type { Category, Facility, HomePoint, Tier } from "../types";
import { matchesArea } from "../area";
import type { Area } from "../area";
import { CategoryChips } from "./CategoryChips";
import { TierChips } from "./TierChips";
import { AreaSelect } from "./AreaSelect";
import { formatDate } from "../format";
import type { Store } from "../store";
import type { Theme } from "../useTheme";

// CARTOのbasemaps用APIキー(ブラウザに配信される前提の公開キー)
const CARTO_KEY = "cb1_47gg_1_758596f4421e625a0e7ceaa6";

// 未訪問(=これから行く場所)を目立たせ、訪問済みは控えめに表示する。
// アイコンはカテゴリ×訪問済みの組み合わせだけなので使い回す
// (毎レンダー新しく作ると全国分のピンが毎回作り直される)
const ICON_CACHE = new Map<string, DivIcon>();

function markerIcon(f: Facility, visited: boolean): DivIcon {
  const key = `${f.category}:${visited}`;
  const cached = ICON_CACHE.get(key);
  if (cached) return cached;
  const cls = visited ? `visited cat-${f.category}` : `cat-${f.category}`;
  const size = visited ? 22 : 32;
  const icon = divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin ${cls}">${visited ? "✓" : CATEGORY_CODE[f.category]}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
  ICON_CACHE.set(key, icon);
  return icon;
}

const HOME_ICON = divIcon({
  className: "map-pin-wrap",
  html: `<span class="map-pin home">⌂</span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// 日本全体(与那国島〜知床)。座標つきの施設が1つもないときの表示範囲
const JAPAN_BOUNDS = latLngBounds([24.0, 122.9], [45.6, 145.9]);

// 上側は右上に浮かべたエリア選択のぶん余白を広めにとる
const FIT_OPTIONS: FitBoundsOptions = {
  paddingTopLeft: [24, 56],
  paddingBottomRight: [24, 24],
  maxZoom: 11,
};

function facilityBounds(facilities: Facility[]): LatLngBounds | null {
  const points = facilities
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => [f.lat!, f.lng!] as [number, number]);
  return points.length > 0 ? latLngBounds(points) : null;
}

// 表示範囲: エリア選択中はそのエリアの施設全体、なければ基準地点の周辺、どちらもなければ全施設(日本全体)
function viewBounds(
  facilities: Facility[],
  area: Area | null,
  home: HomePoint | null,
  rangeKm: number | null,
): LatLngBounds {
  if (area != null) {
    const bounds = facilityBounds(
      facilities.filter((f) => matchesArea(f, area)),
    );
    if (bounds) return bounds;
  }
  if (home) {
    const km = rangeKm ?? DEFAULT_RANGE_KM;
    const dLat = km / 111;
    const dLng = km / (111 * Math.cos((home.lat * Math.PI) / 180));
    return latLngBounds(
      [home.lat - dLat, home.lng - dLng],
      [home.lat + dLat, home.lng + dLng],
    );
  }
  return facilityBounds(facilities) ?? JAPAN_BOUNDS;
}

// エリアを切り替えたら、そのエリアが収まるように地図を動かす(初期表示は MapContainer の bounds で行う)
function FitOnAreaChange({
  area,
  bounds,
}: {
  area: Area | null;
  bounds: LatLngBounds;
}) {
  const map = useMap();
  const prevArea = useRef(area);
  useEffect(() => {
    if (prevArea.current === area) return;
    prevArea.current = area;
    map.fitBounds(bounds, FIT_OPTIONS);
  }, [map, area, bounds]);
  return null;
}

// 基準地点の設定モード中だけ地図クリックを拾う
function PickHandler({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (enabled) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Props {
  store: Store;
  theme: Theme;
  filter: Category[];
  onFilterChange: (filter: Category[]) => void;
  tierFilter: Tier[];
  onTierFilterChange: (tierFilter: Tier[]) => void;
  area: Area | null;
  onAreaChange: (area: Area | null) => void;
  picking: boolean;
  onPickPoint: (lat: number, lng: number) => void;
  onCancelPick: () => void;
  onSelect: (f: Facility) => void;
}

export function MapView({
  store,
  theme,
  filter,
  onFilterChange,
  tierFilter,
  onTierFilterChange,
  area,
  onAreaChange,
  picking,
  onPickPoint,
  onCancelPick,
  onSelect,
}: Props) {
  // Tierで絞り込むときは未分類(カスタム追加分)は表示しない
  const placed = store.facilities.filter(
    (f) =>
      f.lat != null &&
      f.lng != null &&
      (filter.length === 0 || filter.includes(f.category)) &&
      (tierFilter.length === 0 ||
        (f.tier != null && tierFilter.includes(f.tier))) &&
      matchesArea(f, area),
  );
  const bounds = viewBounds(store.facilities, area, store.home, store.rangeKm);
  const tileStyle = theme === "dark" ? "dark_all" : "light_all";

  return (
    <div className="map-wrap">
      <div className="map-chips">
        <CategoryChips selected={filter} onChange={onFilterChange} />
        <TierChips selected={tierFilter} onChange={onTierFilterChange} />
      </div>
      <div className="map-stage">
        <MapContainer
          bounds={bounds}
          boundsOptions={FIT_OPTIONS}
          // 縦長の日本列島を画面いっぱいに収めるため、ズームは0.5刻みで合わせる
          zoomSnap={0.5}
          className="leaflet-root"
          scrollWheelZoom
        >
          <TileLayer
            key={tileStyle}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={`https://basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`}
          />
          <PickHandler enabled={picking} onPick={onPickPoint} />
          <FitOnAreaChange area={area} bounds={bounds} />
          {store.home && (
            <Marker
              position={[store.home.lat, store.home.lng]}
              icon={HOME_ICON}
            />
          )}
          {placed.map((f) => {
            const visited = Boolean(store.visits[f.id]);
            return (
              <Marker
                key={f.id}
                position={[f.lat!, f.lng!]}
                icon={markerIcon(f, visited)}
              >
                <Popup>
                  <div className="map-popup">
                    <strong>{f.name}</strong>
                    <span className="map-popup-sub">
                      {CATEGORY_LABEL[f.category]} ・{" "}
                      {visited
                        ? `${formatDate(store.visits[f.id].date)} 訪問`
                        : "未訪問"}
                    </span>
                    {f.address && (
                      <span className="map-popup-sub">{f.address}</span>
                    )}
                    {f.station && (
                      <span className="map-popup-sub">最寄り: {f.station}</span>
                    )}
                    <button type="button" onClick={() => onSelect(f)}>
                      詳細を開く
                    </button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        {/* 地図の高さを削らないよう、エリア選択は地図の右上に浮かべる */}
        <div className="map-area">
          <AreaSelect area={area} onChange={onAreaChange} />
        </div>
      </div>
      {picking && (
        <div className="map-pick-banner">
          <span>地図をタップして基準地点を設定</span>
          <button type="button" onClick={onCancelPick}>
            キャンセル
          </button>
        </div>
      )}
    </div>
  );
}

import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CODE, CATEGORY_LABEL } from "../types";
import type { Category, Facility, Tier } from "../types";
import { CategoryChips } from "./CategoryChips";
import { TierChips } from "./TierChips";
import { formatDate } from "../format";
import type { Store } from "../store";
import type { Theme } from "../useTheme";

// 未訪問(=これから行く場所)を目立たせ、訪問済みは控えめに表示する
function markerIcon(f: Facility, visited: boolean) {
  const cls = visited ? `visited cat-${f.category}` : `cat-${f.category}`;
  const size = visited ? 22 : 32;
  return divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin ${cls}">${visited ? "✓" : CATEGORY_CODE[f.category]}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const HOME_ICON = divIcon({
  className: "map-pin-wrap",
  html: `<span class="map-pin home">⌂</span>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

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
        (f.tier != null && tierFilter.includes(f.tier))),
  );
  const tileStyle = theme === "dark" ? "dark_all" : "light_all";

  return (
    <div className="map-wrap">
      <div className="map-chips">
        <CategoryChips selected={filter} onChange={onFilterChange} />
        <TierChips selected={tierFilter} onChange={onTierFilterChange} />
      </div>
      <MapContainer
        center={[35.85, 139.75]}
        zoom={8}
        className="leaflet-root"
        scrollWheelZoom
      >
        <TileLayer
          key={tileStyle}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={`https://basemaps.cartocdn.com/${tileStyle}/{z}/{x}/{y}{r}.png`}
        />
        <PickHandler enabled={picking} onPick={onPickPoint} />
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

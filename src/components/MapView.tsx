import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CODE, CATEGORY_LABEL } from "../types";
import type { Facility } from "../types";
import type { Store } from "../store";
import type { Theme } from "../useTheme";

function markerIcon(f: Facility, visited: boolean) {
  const cls = visited ? `cat-${f.category}` : "unvisited";
  return divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin ${cls}">${CATEGORY_CODE[f.category]}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface Props {
  store: Store;
  theme: Theme;
  onSelect: (f: Facility) => void;
}

export function MapView({ store, theme, onSelect }: Props) {
  const placed = store.facilities.filter((f) => f.lat != null && f.lng != null);
  const tileStyle = theme === "dark" ? "dark_all" : "light_all";

  return (
    <div className="map-wrap">
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
                    {CATEGORY_LABEL[f.category]} ・ {f.pref}
                  </span>
                  <span className="map-popup-sub">
                    {visited ? `${store.visits[f.id].date} 訪問` : "未訪問"}
                  </span>
                  <button type="button" onClick={() => onSelect(f)}>
                    詳細を開く
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      <div className="map-legend">
        <span>
          <i className="dot unvisited" /> 未訪問
        </span>
        <span>
          <i className="dot visited" /> 訪問済み(カテゴリ色)
        </span>
      </div>
    </div>
  );
}

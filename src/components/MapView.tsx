import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_CODE, CATEGORY_LABEL } from "../types";
import type { Facility } from "../types";
import type { Store } from "../store";

const CAT_COLOR: Record<string, string> = {
  aquarium: "#38bdf8",
  art: "#f472b6",
  museum: "#fbbf24",
  science: "#34d399",
};

function markerIcon(f: Facility, visited: boolean) {
  const bg = visited ? CAT_COLOR[f.category] : "#3a3a44";
  const fg = visited ? "#101013" : "#8e8e99";
  return divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin" style="background:${bg};color:${fg}">${CATEGORY_CODE[f.category]}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

interface Props {
  store: Store;
  onSelect: (f: Facility) => void;
}

export function MapView({ store, onSelect }: Props) {
  const placed = store.facilities.filter((f) => f.lat != null && f.lng != null);

  return (
    <div className="map-wrap">
      <MapContainer
        center={[35.85, 139.75]}
        zoom={8}
        className="leaflet-root"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
          <i className="dot" style={{ background: "#3a3a44" }} /> 未訪問
        </span>
        <span>
          <i className="dot" style={{ background: "#38bdf8" }} />{" "}
          訪問済み(カテゴリ色)
        </span>
      </div>
    </div>
  );
}

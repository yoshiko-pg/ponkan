import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "../types";
import type { Facility } from "../types";
import type { Store } from "../store";

const CAT_COLOR: Record<string, string> = {
  aquarium: "#3aa6e8",
  art: "#f26ca7",
  museum: "#f5a623",
  science: "#46b36b",
};

function markerIcon(f: Facility, visited: boolean) {
  const bg = visited ? CAT_COLOR[f.category] : "#c9c2b8";
  return divIcon({
    className: "map-pin-wrap",
    html: `<span class="map-pin" style="background:${bg}">${CATEGORY_EMOJI[f.category]}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
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
                    {visited
                      ? `✅ ${store.visits[f.id].date} 訪問`
                      : "⬜ 未訪問"}
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
          <i className="dot" style={{ background: "#c9c2b8" }} /> 未訪問
        </span>
        <span>
          <i className="dot" style={{ background: "#3aa6e8" }} />{" "}
          訪問済み(カテゴリ色)
        </span>
      </div>
    </div>
  );
}

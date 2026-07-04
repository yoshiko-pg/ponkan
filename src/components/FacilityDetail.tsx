import { useState } from "react";
import { CATEGORY_CODE, CATEGORY_LABEL } from "../types";
import type { Facility } from "../types";
import type { Store } from "../store";

interface Props {
  facility: Facility;
  store: Store;
  onClose: () => void;
}

export function FacilityDetail({ facility, store, onClose }: Props) {
  const visit = store.visits[facility.id];
  const [justStamped, setJustStamped] = useState(false);

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(facility.name)}`;
  const mapUrl =
    facility.lat != null && facility.lng != null
      ? `https://www.google.com/maps/search/?api=1&query=${facility.lat},${facility.lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(facility.name)}`;

  const handleStamp = () => {
    store.stamp(facility.id);
    setJustStamped(true);
  };

  const handleRemove = () => {
    if (window.confirm(`「${facility.name}」をリストから削除しますか?`)) {
      store.removeFacility(facility.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="detail-header">
          <span className={`cat-badge cat-${facility.category}`}>
            {CATEGORY_CODE[facility.category]} —{" "}
            {CATEGORY_LABEL[facility.category]}
          </span>
          <h2>{facility.name}</h2>
          {!facility.address && <p className="detail-pref">{facility.pref}</p>}
        </div>

        {(facility.address || facility.station) && (
          <div className="detail-info">
            {facility.address && (
              <div className="info-row">
                <span className="info-label">ADDRESS</span>
                <span className="info-value">{facility.address}</span>
              </div>
            )}
            {facility.station && (
              <div className="info-row">
                <span className="info-label">STATION</span>
                <span className="info-value">{facility.station}</span>
              </div>
            )}
          </div>
        )}

        <div className="detail-links">
          <a href={facility.url ?? searchUrl} target="_blank" rel="noreferrer">
            OFFICIAL SITE
          </a>
          <a href={mapUrl} target="_blank" rel="noreferrer">
            GOOGLE MAPS
          </a>
        </div>

        {visit ? (
          <div className="visit-panel">
            <div
              className={`stamped-mark cat-${facility.category} ${justStamped ? "pop" : ""}`}
            >
              <span>{CATEGORY_CODE[facility.category]}</span>
              <small>VISITED</small>
            </div>
            <label className="field">
              訪問日
              <input
                type="date"
                value={visit.date}
                onChange={(e) =>
                  store.updateVisit(facility.id, { date: e.target.value })
                }
              />
            </label>
            <label className="field">
              メモ
              <textarea
                rows={3}
                placeholder="感想やおみやげの記録など"
                value={visit.memo}
                onChange={(e) =>
                  store.updateVisit(facility.id, { memo: e.target.value })
                }
              />
            </label>
            <button
              type="button"
              className="btn-subtle"
              onClick={() => store.unstamp(facility.id)}
            >
              スタンプを取り消す
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={`btn-stamp cat-${facility.category}`}
            onClick={handleStamp}
          >
            PON!
          </button>
        )}

        <button
          type="button"
          className="btn-danger-link"
          onClick={handleRemove}
        >
          この施設をリストから削除
        </button>
      </div>
    </div>
  );
}

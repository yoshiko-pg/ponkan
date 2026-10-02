import { useRef, useState } from "react";
import type { CSSProperties } from "react";
import exhibitionData from "../data/exhibitions.json";
import { CATEGORY_CODE, CATEGORY_LABEL, TIER_LABEL } from "../types";
import { formatDateLines, formatTerm, toDateString } from "../format";
import { STAMP_IMPACT_MS, makeStampFx, prefersReducedMotion } from "../stampFx";
import type { StampFx } from "../stampFx";
import type { ExhibitionData, Facility } from "../types";
import type { Store } from "../store";
import { StampEffect } from "./StampEffect";

const EXHIBITIONS = (exhibitionData as ExhibitionData).exhibitions;

interface Props {
  facility: Facility;
  store: Store;
  onClose: () => void;
}

export function FacilityDetail({ facility, store, onClose }: Props) {
  const visit = store.visits[facility.id];
  // 直前に押したスタンプの演出。押すたびに作り直す
  const [fx, setFx] = useState<StampFx | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // この施設でいま開催中の特別展(終了分と開催前のものは出さない)
  const today = toDateString(new Date());
  const expos = EXHIBITIONS.filter(
    (ex) =>
      ex.facilityId === facility.id &&
      !(ex.endDate && ex.endDate < today) &&
      !(ex.startDate && ex.startDate > today),
  );

  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(facility.name)}`;
  // 座標だとピンが立つだけなので、施設名で検索して施設ページを開く。
  // 同名施設に当たらないよう都道府県を添える
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${facility.name} ${facility.pref}`)}`;

  const handleStamp = () => {
    const next = makeStampFx(
      facility,
      store.facilities,
      store.visits,
      new Date(),
    );
    store.stamp(facility.id);
    setFx(next);

    if (prefersReducedMotion()) {
      navigator.vibrate?.(60);
      return;
    }
    // 対応端末ではハンコが紙に当たる瞬間に振動させる(節目は2回)
    navigator.vibrate?.(
      next.big ? [0, STAMP_IMPACT_MS, 50, 90, 70] : [0, STAMP_IMPACT_MS, 50],
    );
    // 当たった瞬間にシートごと少し沈ませて、押した重みを出す
    modalRef.current?.animate(
      [
        { transform: "none" },
        { transform: "translateY(3px)" },
        { transform: "none" },
      ],
      { duration: 180, delay: STAMP_IMPACT_MS, easing: "ease-out" },
    );
  };

  const handleUnstamp = () => {
    setMenuOpen(false);
    if (window.confirm("スタンプを取り消しますか?(訪問日とメモも消えます)")) {
      store.unstamp(facility.id);
      setFx(null);
      setEditing(false);
    }
  };

  const handleRemove = () => {
    setMenuOpen(false);
    if (window.confirm(`「${facility.name}」をリストから削除しますか?`)) {
      store.removeFacility(facility.id);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-kebab"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="操作メニュー"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>

        {menuOpen && (
          <>
            <div className="menu-overlay" onClick={() => setMenuOpen(false)} />
            <div className="detail-menu">
              {visit && (
                <button
                  type="button"
                  onClick={() => {
                    setEditing(true);
                    setMenuOpen(false);
                  }}
                >
                  訪問日・メモを編集
                </button>
              )}
              {visit && (
                <button type="button" onClick={handleUnstamp}>
                  スタンプを取り消す
                </button>
              )}
              <button type="button" className="danger" onClick={handleRemove}>
                この施設をリストから削除
              </button>
            </div>
          </>
        )}

        <div className="detail-header">
          <span className={`cat-badge cat-${facility.category}`}>
            {CATEGORY_CODE[facility.category]} —{" "}
            {CATEGORY_LABEL[facility.category]}
          </span>
          {facility.tier != null && (
            <span className="tier-badge">{TIER_LABEL[facility.tier]}</span>
          )}
          <h2>{facility.name}</h2>
          {!facility.address && <p className="detail-pref">{facility.pref}</p>}
        </div>

        <div
          className={`stamp-area cat-${facility.category}`}
          style={{ "--impact": `${STAMP_IMPACT_MS}ms` } as CSSProperties}
        >
          <div className="stamp-stage">
            {visit ? (
              <button
                type="button"
                className={`stamped-mark cat-${facility.category}`}
                onClick={handleStamp}
                aria-label="スタンプを今日の日付で押し直す"
              >
                {/* 押すたびにkeyを変えて作り直し、インクが付くアニメーションを再生する */}
                <span
                  key={fx?.id}
                  className={`stamp-ink ${fx ? (fx.fresh ? "ink-new" : "ink-again") : ""}`}
                >
                  <span className="stamp-date">
                    {formatDateLines(visit.date).map((line) => (
                      <span key={line}>{line}</span>
                    ))}
                  </span>
                </span>
              </button>
            ) : (
              <button
                type="button"
                className="stamped-mark unstamped"
                onClick={handleStamp}
                aria-label="スタンプを押す"
              >
                <span className="stamp-code">
                  {CATEGORY_CODE[facility.category]}
                </span>
                <span className="stamp-hint">タップでポン</span>
              </button>
            )}
            {visit && fx && !prefersReducedMotion() && (
              <StampEffect
                key={fx.id}
                category={facility.category}
                fresh={fx.fresh}
                big={fx.big}
                seed={fx.id}
              />
            )}
          </div>
        </div>

        {facility.description && (
          <p className="detail-description">{facility.description}</p>
        )}

        {visit && editing && (
          <div className="visit-panel">
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
              className="btn-done"
              onClick={() => setEditing(false)}
            >
              完了
            </button>
          </div>
        )}

        {visit && !editing && visit.memo && (
          <p className="memo-text">{visit.memo}</p>
        )}

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

        {expos.length > 0 && (
          <div className="detail-expos">
            <h3 className="detail-expos-title">EXHIBITIONS</h3>
            {expos.map((ex) => (
              <a
                key={ex.url}
                className="detail-expo"
                href={ex.url}
                target="_blank"
                rel="noreferrer"
              >
                <span className="detail-expo-name">
                  {ex.title}
                  <span className="expo-title-arrow"> ↗</span>
                </span>
                <span className="detail-expo-term">{formatTerm(ex)}</span>
              </a>
            ))}
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
      </div>
    </div>
  );
}

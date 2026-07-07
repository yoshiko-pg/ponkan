import { useState } from "react";
import exhibitionData from "../data/exhibitions.json";
import { formatTerm, toDateString } from "../format";
import type { Exhibition, ExhibitionData, Facility } from "../types";
import type { Store } from "../store";

const DATA = exhibitionData as ExhibitionData;

interface Props {
  store: Store;
  // 施設名タップで施設詳細モーダルを開く(スタンプ帳と同じ挙動)
  onSelect: (f: Facility) => void;
}

function ExhibitionCard({
  exhibition,
  facility,
  upcoming,
  endingSoon,
  bookmarked,
  onToggleBookmark,
  onZoom,
  onSelectFacility,
}: {
  exhibition: Exhibition;
  facility: Facility | undefined;
  upcoming: boolean;
  endingSoon: boolean;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onZoom: (imageUrl: string) => void;
  onSelectFacility: (f: Facility) => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const hasImage = exhibition.imageUrl != null && !imgFailed;

  return (
    <div className="expo-card">
      <div className="expo-poster">
        {hasImage ? (
          <button
            type="button"
            className="expo-zoom"
            onClick={() => onZoom(exhibition.imageUrl!)}
            aria-label="ポスターを拡大表示"
          >
            <img
              src={exhibition.imageUrl}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          </button>
        ) : (
          <span className="expo-noimg">ART</span>
        )}
        {upcoming && <span className="expo-badge">開催予定</span>}
        {!upcoming && endingSoon && (
          <span className="expo-badge soon">まもなく終了</span>
        )}
        <button
          type="button"
          className={`expo-bookmark ${bookmarked ? "active" : ""}`}
          onClick={onToggleBookmark}
          aria-pressed={bookmarked}
          aria-label={bookmarked ? "ブックマークを外す" : "ブックマークする"}
        >
          <svg viewBox="0 0 24 30" width="22" height="28" aria-hidden="true">
            <path d="M2 0h20v29l-10-8-10 8z" />
          </svg>
        </button>
      </div>
      <div className="expo-meta">
        {facility && (
          <button
            type="button"
            className="expo-facility"
            onClick={() => onSelectFacility(facility)}
          >
            {facility.name}
          </button>
        )}
        <a
          className="expo-title"
          href={exhibition.url}
          target="_blank"
          rel="noreferrer"
        >
          {exhibition.title}
          <span className="expo-title-arrow"> ↗</span>
        </a>
        <span className="expo-dates">{formatTerm(exhibition)}</span>
      </div>
    </div>
  );
}

export function Exhibitions({ store, onSelect }: Props) {
  const today = toDateString(new Date());
  const soonLimit = toDateString(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  );
  // ポスター拡大表示中の画像URL
  const [zoomed, setZoomed] = useState<string | null>(null);

  const bookmarks = new Set(store.expoBookmarks);
  // 並び順の判定はタブを開いた時点のブックマーク状態で固定する。
  // トグルした瞬間にカードが並び替わるとスクロールがガタついて見失うため、
  // 並び替えは次にタブを開いたときに反映する
  const [sortBookmarks] = useState(() => new Set(store.expoBookmarks));

  // 対象は美術館 tier1/2(非表示にした施設は除く)
  const targets = store.facilities.filter(
    (f) => f.category === "art" && (f.tier === 1 || f.tier === 2),
  );
  const targetIds = new Set(targets.map((f) => f.id));
  const byId = new Map(targets.map((f) => [f.id, f]));

  const active = DATA.exhibitions.filter(
    (ex) => targetIds.has(ex.facilityId) && !(ex.endDate && ex.endDate < today),
  );
  const isUpcoming = (ex: Exhibition) =>
    ex.startDate != null && ex.startDate > today;

  // ブックマーク済みを先頭に、あとは会期順
  const byBookmark = (a: Exhibition, b: Exhibition) =>
    Number(sortBookmarks.has(b.url)) - Number(sortBookmarks.has(a.url));

  const showing = active
    .filter((ex) => !isUpcoming(ex))
    .sort(
      (a, b) =>
        byBookmark(a, b) ||
        (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"),
    );
  const upcoming = active
    .filter(isUpcoming)
    .sort(
      (a, b) => byBookmark(a, b) || a.startDate!.localeCompare(b.startDate!),
    );

  const covered = new Set(active.map((ex) => ex.facilityId));
  const noInfo = targets.filter((f) => !covered.has(f.id));

  const renderCard = (ex: Exhibition, isUp: boolean) => (
    <ExhibitionCard
      key={`${ex.facilityId}-${ex.url}`}
      exhibition={ex}
      facility={byId.get(ex.facilityId)}
      upcoming={isUp}
      endingSoon={!isUp && ex.endDate != null && ex.endDate <= soonLimit}
      bookmarked={bookmarks.has(ex.url)}
      onToggleBookmark={() => store.toggleExpoBookmark(ex.url)}
      onZoom={setZoomed}
      onSelectFacility={onSelect}
    />
  );

  return (
    <div className="exhibitions">
      <div className="count-row">
        <span className="count-label">特別展 ・ 美術館 MAJOR/BASIC</span>
        <span className="count-num">
          {showing.length}
          <small> 開催中</small>
        </span>
      </div>

      {showing.length > 0 && (
        <div className="expo-grid">
          {showing.map((ex) => renderCard(ex, false))}
        </div>
      )}
      {showing.length === 0 && (
        <p className="empty-note">開催中の特別展情報がありません</p>
      )}

      {upcoming.length > 0 && (
        <>
          <h3 className="expo-section-title">COMING SOON</h3>
          <div className="expo-grid">
            {upcoming.map((ex) => renderCard(ex, true))}
          </div>
        </>
      )}

      {noInfo.length > 0 && (
        <>
          <h3 className="expo-section-title">情報を取得できていない施設</h3>
          <div className="expo-missing">
            {noInfo.map((f) => (
              <a
                key={f.id}
                href={
                  f.url ??
                  `https://www.google.com/search?q=${encodeURIComponent(`${f.name} 展覧会`)}`
                }
                target="_blank"
                rel="noreferrer"
              >
                <span>{f.name}</span>
                <span className="expo-missing-arrow">公式サイトへ →</span>
              </a>
            ))}
          </div>
        </>
      )}

      {DATA.updatedAt && (
        <p className="expo-updated">DATA UPDATED {DATA.updatedAt}</p>
      )}

      {zoomed && (
        <div
          className="expo-lightbox"
          onClick={() => setZoomed(null)}
          role="dialog"
          aria-label="ポスター拡大表示"
        >
          <button
            type="button"
            className="modal-close expo-lightbox-close"
            onClick={() => setZoomed(null)}
          >
            ×
          </button>
          <img src={zoomed} alt="" referrerPolicy="no-referrer" />
        </div>
      )}
    </div>
  );
}

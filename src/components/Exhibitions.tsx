import { useState } from "react";
import exhibitionData from "../data/exhibitions.json";
import type { Exhibition, ExhibitionData, Facility } from "../types";
import type { Store } from "../store";

const DATA = exhibitionData as ExhibitionData;

interface Props {
  store: Store;
}

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// "2026-09-23" → "9/23"(年が今年でなければ "2027/1/12")
function formatDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const thisYear = new Date().getFullYear();
  return y === thisYear ? `${m}/${d}` : `${y}/${m}/${d}`;
}

function formatTerm(ex: Exhibition): string {
  if (ex.startDate && ex.endDate)
    return `${formatDay(ex.startDate)} – ${formatDay(ex.endDate)}`;
  if (ex.endDate) return `〜 ${formatDay(ex.endDate)}まで`;
  if (ex.startDate) return `${formatDay(ex.startDate)} 〜`;
  return "会期はサイトを確認";
}

function ExhibitionCard({
  exhibition,
  facility,
  upcoming,
  endingSoon,
}: {
  exhibition: Exhibition;
  facility: Facility | undefined;
  upcoming: boolean;
  endingSoon: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <a
      className="expo-card"
      href={exhibition.url}
      target="_blank"
      rel="noreferrer"
    >
      <div className="expo-poster">
        {exhibition.imageUrl && !imgFailed ? (
          <img
            src={exhibition.imageUrl}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="expo-noimg">ART</span>
        )}
        {upcoming && <span className="expo-badge">開催予定</span>}
        {!upcoming && endingSoon && (
          <span className="expo-badge soon">まもなく終了</span>
        )}
      </div>
      <div className="expo-meta">
        <span className="expo-facility">{facility?.name ?? ""}</span>
        <span className="expo-title">{exhibition.title}</span>
        <span className="expo-dates">{formatTerm(exhibition)}</span>
      </div>
    </a>
  );
}

export function Exhibitions({ store }: Props) {
  const today = toDateString(new Date());
  const soonLimit = toDateString(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
  );

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

  const showing = active
    .filter((ex) => !isUpcoming(ex))
    .sort((a, b) => (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999"));
  const upcoming = active
    .filter(isUpcoming)
    .sort((a, b) => a.startDate!.localeCompare(b.startDate!));

  const covered = new Set(active.map((ex) => ex.facilityId));
  const noInfo = targets.filter((f) => !covered.has(f.id));

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
          {showing.map((ex) => (
            <ExhibitionCard
              key={`${ex.facilityId}-${ex.url}`}
              exhibition={ex}
              facility={byId.get(ex.facilityId)}
              upcoming={false}
              endingSoon={ex.endDate != null && ex.endDate <= soonLimit}
            />
          ))}
        </div>
      )}
      {showing.length === 0 && (
        <p className="empty-note">開催中の特別展情報がありません</p>
      )}

      {upcoming.length > 0 && (
        <>
          <h3 className="expo-section-title">COMING SOON</h3>
          <div className="expo-grid">
            {upcoming.map((ex) => (
              <ExhibitionCard
                key={`${ex.facilityId}-${ex.url}`}
                exhibition={ex}
                facility={byId.get(ex.facilityId)}
                upcoming
                endingSoon={false}
              />
            ))}
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
    </div>
  );
}

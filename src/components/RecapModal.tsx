import { useEffect, useState } from "react";
import { generateRecapImage } from "../recap";
import type { RecapVisit } from "../recap";
import type { Store } from "../store";

interface Props {
  year: number;
  store: Store;
  onClose: () => void;
}

// 年間の訪問をまとめたシェア画像を生成して表示するモーダル
export function RecapModal({ year, store, onClose }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    const byId = new Map(store.facilities.map((f) => [f.id, f]));
    const visits: RecapVisit[] = Object.entries(store.visits)
      .filter(([, v]) => v.date.startsWith(`${year}-`))
      .flatMap(([id, v]) => {
        const facility = byId.get(id);
        return facility
          ? [{ category: facility.category, date: v.date, name: facility.name }]
          : [];
      })
      .sort((a, b) => a.date.localeCompare(b.date));

    generateRecapImage(year, visits)
      .then((b) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(b);
        setBlob(b);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [year, store.visits, store.facilities]);

  const download = () => {
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `ponkan-recap-${year}.png`;
    a.click();
  };

  const share = async () => {
    if (!blob) return;
    const file = new File([blob], `ponkan-recap-${year}.png`, {
      type: "image/png",
    });
    if (navigator.canShare?.({ files: [file] })) {
      // ユーザーが共有をキャンセルしたときのAbortErrorは無視する
      await navigator.share({ files: [file] }).catch(() => {});
    } else {
      download();
    }
  };

  return (
    <div className="recap-backdrop" onClick={onClose}>
      <div className="recap-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
        <h3 className="recap-title">{year}年のポン</h3>
        {failed && <p className="menu-text">画像を生成できませんでした</p>}
        {!failed &&
          (url ? (
            <img
              className="recap-image"
              src={url}
              alt={`${year}年の訪問記録画像`}
            />
          ) : (
            <p className="menu-text">生成中…</p>
          ))}
        <div className="data-actions">
          <button type="button" onClick={share} disabled={!blob}>
            シェア
          </button>
          <button type="button" onClick={download} disabled={!url}>
            画像を保存
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { CATEGORIES, CATEGORY_EMOJI, CATEGORY_LABEL } from "../types";
import type { Category } from "../types";
import type { Store } from "../store";

interface Props {
  store: Store;
  onClose: () => void;
}

export function AddFacility({ store, onClose }: Props) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("museum");
  const [pref, setPref] = useState("東京都");
  const [url, setUrl] = useState("");
  const [latLng, setLatLng] = useState("");

  const handleSubmit = () => {
    if (!name.trim()) return;
    let lat: number | undefined;
    let lng: number | undefined;
    const m = latLng
      .trim()
      .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    if (m) {
      lat = Number(m[1]);
      lng = Number(m[2]);
    }
    store.addFacility({
      name: name.trim(),
      category,
      pref: pref.trim() || "不明",
      url: url.trim() || undefined,
      lat,
      lng,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose}>
          ×
        </button>
        <h2 className="add-title">施設を追加</h2>
        <label className="field">
          名前
          <input
            type="text"
            value={name}
            placeholder="○○水族館"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="field">
          カテゴリ
          <div className="cat-select">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat}
                className={`chip chip-${cat} ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat]}
              </button>
            ))}
          </div>
        </div>
        <label className="field">
          都道府県
          <input
            type="text"
            value={pref}
            onChange={(e) => setPref(e.target.value)}
          />
        </label>
        <label className="field">
          公式サイトURL(任意)
          <input
            type="url"
            value={url}
            placeholder="https://..."
            onChange={(e) => setUrl(e.target.value)}
          />
        </label>
        <label className="field">
          座標(任意・「緯度, 経度」形式)
          <input
            type="text"
            value={latLng}
            placeholder="35.68, 139.76"
            onChange={(e) => setLatLng(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="btn-stamp cat-museum"
          disabled={!name.trim()}
          onClick={handleSubmit}
        >
          追加する
        </button>
      </div>
    </div>
  );
}

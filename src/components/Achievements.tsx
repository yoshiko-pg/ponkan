import { useRef } from "react";
import { computeBadges } from "../badges";
import type { Store } from "../store";

interface Props {
  store: Store;
}

export function Achievements({ store }: Props) {
  const badges = computeBadges(store.facilities, store.visits);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = store.importJson(String(reader.result));
      window.alert(
        ok
          ? "データを読み込みました"
          : "読み込めませんでした。ファイルを確認してください",
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="achievements">
      <div className="badge-grid">
        {badges.map((b) => (
          <div
            key={b.id}
            className={`badge-card ${b.achieved ? "achieved" : ""}`}
          >
            <span className="badge-emoji">{b.emoji}</span>
            <span className="badge-name">{b.name}</span>
            <span className="badge-desc">{b.description}</span>
            <span className="badge-progress">{b.progress}</span>
          </div>
        ))}
      </div>

      <div className="data-panel">
        <h3>データ</h3>
        <p className="data-note">
          記録はこの端末のブラウザに保存されます。バックアップはJSONで書き出せます。
        </p>
        <div className="data-actions">
          <button type="button" onClick={store.exportJson}>
            ⬇️ エクスポート
          </button>
          <button type="button" onClick={() => fileRef.current?.click()}>
            ⬆️ インポート
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

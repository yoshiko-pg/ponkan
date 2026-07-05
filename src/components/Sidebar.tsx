import { useRef } from "react";
import { requestCurrentLocation } from "../geo";
import type { Store } from "../store";
import type { Theme } from "../useTheme";

interface Props {
  store: Store;
  theme: Theme;
  onToggleTheme: () => void;
  onPickOnMap: () => void;
  onClose: () => void;
}

export function Sidebar({
  store,
  theme,
  onToggleTheme,
  onPickOnMap,
  onClose,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const useCurrentLocation = () => {
    requestCurrentLocation(store.setHome);
  };

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
    <div className="sidebar-backdrop" onClick={onClose}>
      <aside className="sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-head">
          <span className="sidebar-title">MENU</span>
          <button
            type="button"
            className="modal-close sidebar-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <section className="menu-section">
          <h3>APPEARANCE</h3>
          <button type="button" className="menu-row" onClick={onToggleTheme}>
            <span>{theme === "dark" ? "ダークモード" : "ライトモード"}</span>
            {theme === "dark" ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
              </svg>
            )}
          </button>
        </section>

        <section className="menu-section">
          <h3>LOCATION</h3>
          <p className="menu-text">
            {store.home
              ? `基準地点: ${store.home.lat.toFixed(3)}, ${store.home.lng.toFixed(3)}`
              : "自宅などの基準地点を登録すると、一覧を距離で絞り込み・近い順に並べられます。"}
          </p>
          <div className="data-actions">
            <button type="button" onClick={useCurrentLocation}>
              現在地を使う
            </button>
            <button type="button" onClick={onPickOnMap}>
              地図で選ぶ
            </button>
          </div>
          {store.home && (
            <button
              type="button"
              className="btn-subtle"
              onClick={() => store.setHome(null)}
            >
              基準地点をクリア
            </button>
          )}
        </section>

        <section className="menu-section">
          <h3>DATA</h3>
          <p className="menu-text">
            訪問記録・メモ・リスト編集を含む全データをJSONでバックアップ/復元できます。
          </p>
          <div className="data-actions">
            <button type="button" onClick={store.exportJson}>
              EXPORT
            </button>
            <button type="button" onClick={() => fileRef.current?.click()}>
              IMPORT
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
        </section>

        <section className="menu-section">
          <h3>ABOUT</h3>
          <p className="menu-text">
            関東近郊の水族館・美術館・博物・科学館をめぐる自分用スタンプラリー。
            行った施設を開いてスタンプが押せます。
          </p>
          <p className="menu-text">
            訪問記録・メモはこの端末のブラウザ(localStorage)にのみ保存されます。
            座標・住所はおおよその値です。
          </p>
          <a
            className="menu-row menu-link"
            href="https://github.com/yoshiko-pg/ponkan"
            target="_blank"
            rel="noreferrer"
          >
            <span>GitHub</span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.85.09-.66.35-1.12.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z" />
            </svg>
          </a>
        </section>
      </aside>
    </div>
  );
}

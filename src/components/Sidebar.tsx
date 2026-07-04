import { useRef } from "react";
import type { Store } from "../store";
import type { Theme } from "../useTheme";

interface Props {
  store: Store;
  theme: Theme;
  onToggleTheme: () => void;
  onClose: () => void;
}

export function Sidebar({ store, theme, onToggleTheme, onClose }: Props) {
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
          <h3>ABOUT</h3>
          <p className="menu-text">
            関東近郊の水族館・美術館・博物館・科学館をめぐる自分用スタンプラリー。
            行った施設を開いて「PON!」でスタンプが押せます。
          </p>
          <p className="menu-text">
            訪問記録・メモはこの端末のブラウザ(localStorage)にのみ保存されます。
            座標・住所はおおよその値です。
          </p>
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
      </aside>
    </div>
  );
}

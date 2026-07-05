# PONKAN 🍊

**関東近郊の水族館・美術館・博物館・科学館をめぐるスタンプラリーwebアプリ**

行った施設に訪問日つきのスタンプを押していけます。
水族館 20 / 美術館 59 / 博物館 58 / 科学館 35 の計172館を収録しています。

👉 **https://yoshiko-pg.github.io/ponkan/**

## データはすべてブラウザの中だけ

PONKANにはサーバーがありません。静的ファイルを配信しているだけで、バックエンドもデータベースも存在しません。

- 訪問記録・メモ・設定は、すべて**お使いの端末のブラウザ内(localStorage)にのみ保存**されます
- 入力したデータが外部に送信されることは一切ありません
- アカウント登録も不要です

そのぶんデータは端末・ブラウザごとに独立しているので、機種変更などの際はメニューのEXPORT / IMPORT(JSONファイル)で引き継いでください。

## 機能

- **スタンプ帳** — 施設ごとの丸スタンプがずらりと並ぶメイン画面。カテゴリでの絞り込みと、カテゴリ別の達成率表示
- **スタンプを押す** — 施設を開いてスタンプをタップ。訪問日(あとから変更可)とメモを記録できます
- **マップ** — Leaflet + OpenStreetMapで全施設をピン表示。未訪問はカテゴリ色で目立たせ、訪問済みはチェックマークで控えめに
- **距離で絞り込み** — 自宅などの基準地点を登録すると(現在地取得 or 地図タップ)、一覧を近い順に並べ替え、30 / 60 / 100km圏内で絞り込めます
- **施設詳細** — 住所・最寄り駅の表示、公式サイト / Googleマップへのリンク。不要な施設はリストから削除もできます
- **特別展一覧(EXHIBITS)** — 美術館(MAJOR / BASIC)で開催中・開催予定の特別展をポスター画像つきで一覧表示。カードから展覧会サイトへ飛べます
- **バックアップ** — 全データをJSONでエクスポート / インポート
- **ダークモード** — ライト / ダークの切り替え(地図のタイルも連動)
- **PWA** — スマホのホーム画面に追加すればアプリのように使えます

## 開発

TypeScript + React + Vite。パッケージマネージャーはpnpmです。

```sh
pnpm install
pnpm dev      # 開発サーバー
pnpm lint     # oxlint
pnpm build    # 型チェック + 本番ビルド
```

`main` へのpushでGitHub Actionsが自動的にGitHub Pagesへデプロイします。

### 特別展データの自動更新

特別展タブのデータは [src/data/exhibitions.json](src/data/exhibitions.json) にあり、
[scripts/fetch-exhibitions.ts](scripts/fetch-exhibitions.ts) が各美術館の公式サイトから
タイトル・会期・ポスター画像(OGP等)を取得して生成します。

```sh
pnpm fetch-exhibitions              # 全館取得してJSONを更新
pnpm fetch-exhibitions nmwa         # 1施設だけデバッグ実行(書き込みなし)
```

GitHub Actions([update-exhibitions.yml](.github/workflows/update-exhibitions.yml))が
**毎週月曜 6:00 JST** に実行し、差分があればコミット → デプロイまで自動で行います。
取得先の設定(一覧ページURL・抽出ルール)は [scripts/exhibition-sources.ts](scripts/exhibition-sources.ts) にあります。
サイト構造が変わって取得できなくなった施設は前回データを維持し、会期が過ぎた展覧会は表示されません。

## メモ

- 施設の座標・住所はおおよその値です。初期データは [src/data/facilities.ts](src/data/facilities.ts) で編集できます
- 記録データはlocalStorageのキー `ponkan:v1` に保存されます

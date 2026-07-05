import type { Exhibition } from "../src/types.ts";

// 特別展の自動取得対象(美術館 tier1/tier2)。
// listUrl の HTML から linkPattern にマッチする詳細ページを拾い、
// 各詳細ページの OGP と日付表記から会期・ポスター画像を抽出する。
export interface ExhibitionSource {
  facilityId: string;
  // 開催中(・開催予定)の展覧会一覧ページ。複数指定可
  listUrl: string | string[];
  // 絶対URL化した詳細ページURLがこのパターンにマッチしたら展覧会として扱う
  linkPattern: RegExp;
  // 一覧を辿らず listUrl 自体を展覧会ページとして扱う(固定URL・1ページ1展示のサイト)
  selfDetail?: boolean;
  // マッチしても除外するURL(アーカイブ・過去展など)
  excludePattern?: RegExp;
  // タイトルがこれにマッチする展示は除外(所蔵展・常設展など)
  excludeTitle?: RegExp;
  // 詳細ページからタイトルを抜き出す正規表現(グループ1)。未指定なら og:title → <title> → <h1>
  titleRe?: RegExp;
  // og:title がサイト共通で使えないサイトは <title> タグを優先する
  titleFrom?: "titleTag";
  // <title> が「サイト名 | 展覧会名」の順のサイトで採用するセグメント位置
  titleSegment?: number;
  // 抽出したタイトルから最後に取り除く表記(サイト名の残骸など)
  titleStrip?: RegExp;
  // 会期が年なし(「5月29日〜8月12日」)で書かれるサイトは今年開催とみなす
  noYearDates?: boolean;
  // 会期の機械抽出が不可能なサイトは会期なしで掲載する(一覧から消えたら自動で落ちる)
  noDates?: boolean;
  // 詳細ページからポスター画像URLを抜き出す正規表現(グループ1)。未指定なら og:image → 本文imgの推定
  imageRe?: RegExp;
  // 会期を抽出できなかったページを展覧会として扱わない(一覧に雑多なページが混ざるサイト向け)
  requireDates?: boolean;
  // 一覧から拾う詳細ページの最大数
  maxLinks?: number;
}

// 東京都現代美術館の一覧JSONは年度単位(4月始まり)
const FISCAL_YEAR =
  new Date().getMonth() + 1 >= 4
    ? new Date().getFullYear()
    : new Date().getFullYear() - 1;

export const SOURCES: ExhibitionSource[] = [
  // ---- 美術館 Tier 1 ----
  {
    facilityId: "nmwa",
    listUrl: [
      "https://www.nmwa.go.jp/jp/exhibitions/current.html",
      "https://www.nmwa.go.jp/jp/exhibitions/upcoming.html",
    ],
    linkPattern: /nmwa\.go\.jp\/jp\/exhibitions\/\d{4}[\w-]+\.html$/,
    titleFrom: "titleTag",
    excludeTitle: /コレクション・イン・フォーカス/,
  },
  {
    facilityId: "nact",
    listUrl: "https://www.nact.jp/exhibition_special/",
    linkPattern: /nact\.jp\/exhibition_special\/\d{4}\/[\w-]+\/$/,
    titleFrom: "titleTag",
  },
  {
    facilityId: "momat",
    listUrl: "https://www.momat.go.jp/exhibitions",
    linkPattern: /momat\.go\.jp\/exhibitions\/\d+$/,
  },
  {
    facilityId: "mori-art",
    listUrl: "https://www.mori.art.museum/jp/exhibitions/",
    linkPattern: /mori\.art\.museum\/jp\/exhibitions\/[\w-]+\/index\.html$/,
    excludeTitle: /MAM(コレクション|スクリーン|リサーチ)/,
  },
  {
    facilityId: "ghibli-museum",
    // 企画展示のアーカイブが新しい順に並ぶ。先頭のみが開催中
    listUrl: "https://www.ghibli-museum.jp/exhibition/",
    linkPattern: /ghibli-museum\.jp\/exhibition\/\d{6}\/$/,
    maxLinks: 1,
  },
  // 彫刻の森美術館: 常設中心で特別展の定常的な一覧が無いため対象外
  {
    facilityId: "pola-museum",
    listUrl: "https://www.polamuseum.or.jp/exhibition/",
    // {yyyymmdd}01 が企画展(cNN のコレクション展は除外)。特設サイトへリダイレクトされる
    linkPattern: /polamuseum\.or\.jp\/exhibition\/\d{8}01\/$/,
  },

  // ---- 美術館 Tier 2 ----
  {
    facilityId: "tobikan",
    listUrl: "https://www.tobikan.jp/exhibition/index.html",
    linkPattern: /tobikan\.jp\/exhibition\/\d{4}_[\w-]+\.html$/,
    titleFrom: "titleTag",
  },
  {
    facilityId: "mot",
    // 一覧ページはJSレンダリングだが、年度別のJSONが公開されている
    listUrl: `https://www.mot-art-museum.jp/exhibitions/${FISCAL_YEAR}/index.json`,
    linkPattern: /mot-art-museum\.jp\/exhibitions\/[\w-]+\/$/,
    excludePattern: /mot-collection/,
    excludeTitle: /MOTコレクション/,
    maxLinks: 12,
  },
  {
    facilityId: "suntory-museum",
    // 注意: データセンターIPからは403になることがある(その場合は前回データを維持)
    listUrl: [
      "https://www.suntory.co.jp/sma/exhibition/",
      "https://www.suntory.co.jp/sma/exhibition/future.html",
    ],
    linkPattern: /suntory\.co\.jp\/sma\/exhibition\/\d{4}_\d+\/(index\.html)?$/,
    titleStrip: /\s*サントリー美術館$/,
  },
  {
    facilityId: "artizon",
    listUrl: "https://www.artizon.museum/exhibition/",
    linkPattern: /artizon\.museum\/exhibition\/detail\/\d+$/,
    // og:image がサイト共通ロゴのため、S3上のキービジュアルを拾う
    imageRe: /(?:data-src|src)\s*=\s*["'](https:\/\/atz-image[^"']+)["']/,
  },
  {
    facilityId: "mimt",
    listUrl: "https://mimt.jp/exhibition/",
    // 企画展ごとの特設サイト /ex_sp/ を拾う(小企画展ページはJS依存のため対象外)
    linkPattern: /mimt\.jp\/ex_sp\/[\w-]+\/$/,
    // 開幕前のティザーページは会期情報が無く誤検出のもとになる
    excludePattern: /teaser/,
  },
  {
    facilityId: "nezu-museum",
    listUrl: [
      "https://www.nezu-muse.or.jp/jp/exhibitions/current/",
      "https://www.nezu-muse.or.jp/jp/exhibitions/upcoming/",
    ],
    linkPattern: /(?:)/,
    selfDetail: true,
  },
  {
    facilityId: "2121-design-sight",
    listUrl: [
      "https://www.2121designsight.jp/program/",
      "https://www.2121designsight.jp/gallery3/",
    ],
    linkPattern: /2121designsight\.jp\/(?:program|gallery3)\/[\w-]+\/$/,
    excludePattern: /archive|documents|aboutus/,
    titleFrom: "titleTag",
    // <title> は「21_21 DESIGN SIGHT | 展覧会名 | ページ名」の順
    titleSegment: 1,
    imageRe: /(?:data-src|src)\s*=\s*["']([^"']*(?:topweb|header)\.jpg)["']/,
    requireDates: true,
  },
  {
    facilityId: "yokohama-museum",
    listUrl: "https://yokohama.art.museum/exhibition/",
    linkPattern: /yokohama\.art\.museum\/exhibition\/\d{6}_[\w-]+\/$/,
    excludePattern: /_collection/,
    excludeTitle: /コレクション展/,
  },
  {
    facilityId: "ueno-royal-museum",
    listUrl: "https://www.ueno-mori.org/exhibitions/",
    linkPattern: /ueno-mori\.org\/exhibitions\/article\.cgi\?id=\d+/,
    titleFrom: "titleTag",
    titleStrip: /^上野の森美術館\s*[-–—―]\s*展示のご案内\s*[-–—―]\s*/,
    // 詳細ページの日付は月別カレンダーの区切りで会期として信頼できないため載せない
    noDates: true,
    maxLinks: 4,
  },
  {
    facilityId: "teien-art-museum",
    listUrl: "https://www.teien-art-museum.ne.jp/exhibition/",
    linkPattern: /teien-art-museum\.ne\.jp\/exhibition\/[\w-]+\/$/,
    // 年別アーカイブ(/exhibition/2026/)なども除外
    excludePattern: /\/exhibition\/(?:archive|schedule|\d{4}\/$)/,
  },
  {
    facilityId: "top-museum",
    listUrl: "https://topmuseum.jp/exhibition/",
    linkPattern: /topmuseum\.jp\/exhibition\/\d+\/$/,
    excludeTitle: /TOPコレクション|恵比寿映像祭/,
  },
  {
    facilityId: "sumida-hokusai",
    listUrl: [
      "https://hokusai-museum.jp/",
      "https://hokusai-museum.jp/modules/Exhibition/exhibitions/next",
    ],
    linkPattern:
      /hokusai-museum\.jp\/modules\/Exhibition\/exhibitions\/view\/\d+/,
    titleRe:
      /<h2[^>]*class="[^"]*exhibition-title[^"]*"[^>]*>([\s\S]*?)<\/h2>/i,
    imageRe: /(?:data-src|src)\s*=\s*["']([^"']*chirashi_image[^"']+)["']/,
    excludeTitle: /常設展/,
    requireDates: true,
  },
  {
    facilityId: "yamatane-museum",
    listUrl: "https://www.yamatane-museum.jp/exhibitions/",
    linkPattern: /yamatane-museum\.jp\/exhibitions\/2\d{3}\/[\w-]+\.html$/,
    // 一覧に過去年のリンクが多数並ぶため多めに辿り、会期フィルタで絞る
    maxLinks: 15,
  },
  {
    facilityId: "ota-memorial",
    // WordPressのルート直下スラッグが展覧会ページ。年間スケジュールから拾う
    listUrl: "https://www.ukiyoe-ota-muse.jp/schedule/",
    linkPattern: /ukiyoe-ota-muse\.jp\/[\w-]+\/$/,
    excludePattern:
      /\/(schedule|exhibition|news|category|tag|about|guide|access|admission|contact|faq|shop|publication|library|link|privacy|sitemap|en|kids|wp-|feed|blog|archives|language)/,
    titleFrom: "titleTag",
    requireDates: true,
    maxLinks: 4,
  },
  {
    facilityId: "sompo-museum",
    listUrl: "https://www.sompo-museum.org/exhibitions/",
    linkPattern: /sompo-museum\.org\/exhibitions\/\d{4}\/[\w-]+\/$/,
    excludePattern: /schedule/,
  },
  {
    facilityId: "tokyo-station-gallery",
    listUrl: "https://www.ejrcf.or.jp/gallery/exhibition.html",
    linkPattern: /ejrcf\.or\.jp\/gallery\/exhibition\/\d{6}_[\w-]+\.html$/,
    titleFrom: "titleTag",
    imageRe: /(?:data-src|src)\s*=\s*["']([^"']*img_mv_[^"']+)["']/,
  },
  {
    facilityId: "setagaya-art-museum",
    listUrl: "https://www.setagayaartmuseum.or.jp/exhibition/special/",
    linkPattern:
      /setagayaartmuseum\.or\.jp\/exhibition\/special\/detail\.php\?id=sp\d+/,
  },
  {
    facilityId: "opera-city-gallery",
    // トップページのバナーから企画展特設ページ /ag/exhNNN/ を拾う
    listUrl: "https://www.operacity.jp/ag/",
    linkPattern: /operacity\.jp\/ag\/exh\d+\/$/,
  },
  {
    facilityId: "seikado-bunko",
    listUrl: [
      "https://www.seikado.or.jp/exhibition/current_exhibition/",
      "https://www.seikado.or.jp/exhibition/next_exhibition/",
    ],
    linkPattern: /(?:)/,
    selfDetail: true,
    titleRe: /<h4[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h4>/i,
    imageRe:
      /(?:data-src|src)\s*=\s*["']([^"']*images\/exhibition\/[^"']+)["']/,
  },
  {
    facilityId: "moma-kanagawa-hayama",
    listUrl: "https://www.moma.pref.kanagawa.jp/exhibition/",
    linkPattern: /moma\.pref\.kanagawa\.jp\/exhibition\/\d{4}-[\w-]+\/$/,
    excludePattern: /collection/,
    excludeTitle: /コレクション|併陳/,
    // キービジュアルのファイル名が slug+logo01.jpg 形式で汎用の除外に引っかかるため明示
    imageRe:
      /(?:data-src|src)\s*=\s*["']([^"']*wp-content\/uploads\/\d{4}-[^"']+)["']/,
  },
  // 川崎市岡本太郎美術館: 2026年度は改修休館中(ミニ企画のみ)。MANUAL_EXHIBITIONS で管理
  {
    facilityId: "okada-museum",
    // 1館1展示制で /exhibition/ 自体が現在の展覧会ページ
    listUrl: "https://www.okada-museum.com/exhibition/",
    linkPattern: /(?:)/,
    selfDetail: true,
  },
  {
    facilityId: "hakone-glass-forest",
    listUrl: "https://www.hakone-garasunomori.jp/event/",
    linkPattern: /hakone-garasunomori\.jp\/event\/[\w%-]+\/$/,
    excludePattern: /archive|category/,
    excludeTitle: /コンサート|ワークショップ/,
    requireDates: true,
  },
  {
    facilityId: "hakone-lalique",
    // 年1回の企画展。/plan/ の先頭(最新)のみ拾う
    listUrl: "https://www.lalique-museum.com/plan/",
    linkPattern: /lalique-museum\.com\/plan\/[^/?"']+\/?$/,
    excludePattern: /\/page\//,
    maxLinks: 1,
  },
  {
    facilityId: "yokosuka-museum",
    listUrl: "https://www.yokosuka-moa.jp/exhibition/index.html",
    linkPattern:
      /yokosuka-moa\.jp\/archive\/exhibition\/\d{4}\/\d{8}-\d+\.html$/,
    titleFrom: "titleTag",
    excludeTitle: /所蔵品|谷内六郎/,
    // og:image がサイト共通画像のため、展覧会ごとの静的画像を拾う
    imageRe:
      /(?:data-src|src)\s*=\s*["']([^"']*\/static\/exhibition\/[^"']+)["']/,
  },
  {
    facilityId: "momas",
    // 公式サイトは pref.spec.ed.jp へ移転済み(momas.jp は別サイト化)
    listUrl: "https://pref.spec.ed.jp/momas/",
    linkPattern: /pref\.spec\.ed\.jp\/momas\/2\d{3}[a-z]\w*$/,
    titleFrom: "titleTag",
    imageRe:
      /(?:data-src|src)\s*=\s*["']([^"']*wysiwyg\/image\/download[^"']+)["']/,
    excludeTitle: /MOMASコレクション/,
    requireDates: true,
  },
  {
    facilityId: "kadokawa-musashino-museum",
    listUrl: "https://kadcul.com/event/",
    linkPattern: /kadcul\.com\/event\/\d+$/,
    // 常時開催の展示・イベント(会期なし)は除外
    requireDates: true,
  },
  {
    facilityId: "omiya-bonsai-museum",
    listUrl: "https://www.bonsai-art-museum.jp/ja/exhibition/",
    linkPattern: /bonsai-art-museum\.jp\/ja\/exhibition\/exhibition-\d+\/$/,
    // <title> は館名のみ。本文の <h2> が展覧会名
    titleRe: /<h2[^>]*>([\s\S]*?)<\/h2>/i,
    // 毎月入れ替わる所蔵盆栽の展示は対象外
    excludeTitle: /季節の展示/,
    requireDates: true,
    maxLinks: 10,
  },
  {
    facilityId: "chiba-pref-museum-art",
    listUrl: "https://www.chiba-muse.or.jp/ART/exhibition/",
    linkPattern: /chiba-muse\.or\.jp\/ART\/exhibition\/events\/event-\d+\/$/,
  },
  {
    facilityId: "chiba-city-museum-art",
    listUrl: [
      "https://www.ccma-net.jp/exhibitions/",
      "https://www.ccma-net.jp/exhibitions/upcoming/",
    ],
    linkPattern: /ccma-net\.jp\/exhibitions\/(?:special|lab)\/[\w%-]+\/$/,
  },
  {
    facilityId: "hoki-museum",
    // 一覧ページはなく、トップのナビから現在の企画展1件を拾う
    listUrl: "https://www.hoki-museum.jp/",
    linkPattern: /hoki-museum\.jp\/special_exhibition\/[\w-]+\/$/,
    titleFrom: "titleTag",
    maxLinks: 1,
  },
];

// 自動取得が難しい施設の手動メンテ分。
// 会期終了後は自動的に表示されなくなるので、次の展示が決まったら追記する。
export const MANUAL_EXHIBITIONS: Exhibition[] = [
  // 川崎市岡本太郎美術館(2026年度は展示室改修のため無料ミニ企画のみ)
  {
    facilityId: "taro-okamoto-museum",
    title: "無料ミニ企画「ちょこっとTARO 太郎の森」",
    url: "https://www.taromuseum.jp/exhibition.html",
    imageUrl:
      "https://www.taromuseum.jp/wp/wp-content/uploads/2026/02/%E3%81%A1%E3%82%87%E3%81%93%E3%81%A3%E3%81%A8TARO%E3%83%AD%E3%82%B4_page-0001-1-e1771554522862.png",
    startDate: "2026-04-18",
    endDate: "2026-07-12",
  },
  {
    facilityId: "taro-okamoto-museum",
    title: "無料ミニ企画「ちょこっとTARO 太郎のかわいい」",
    url: "https://www.taromuseum.jp/nextexhibition.html",
    imageUrl:
      "https://www.taromuseum.jp/wp/wp-content/uploads/2026/02/%E3%81%A1%E3%82%87%E3%81%93%E3%81%A3%E3%81%A8TARO%E3%83%AD%E3%82%B4_page-0001-1-e1771554522862.png",
    startDate: "2026-07-18",
    endDate: "2026-12-06",
  },
];

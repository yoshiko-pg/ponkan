// 美術館(tier1/tier2)の公式サイトから開催中・開催予定の特別展を取得して
// src/data/exhibitions.json を更新する。
//
//   pnpm fetch-exhibitions
//
// GitHub Actions (.github/workflows/update-exhibitions.yml) から週次で実行される。
// 取得に失敗した施設は前回の exhibitions.json の内容を維持する(会期が過ぎた
// 展覧会はここと UI 側のフィルタで非表示になるため、古いデータが残っても実害はない)。

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Exhibition, ExhibitionData } from "../src/types.ts";
import { MANUAL_EXHIBITIONS, SOURCES } from "./exhibition-sources.ts";
import type { ExhibitionSource } from "./exhibition-sources.ts";

const OUT_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  "../src/data/exhibitions.json",
);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36 ponkan-exhibitions";

// 開催予定としてどこまで先の展覧会を含めるか
const UPCOMING_LIMIT_DAYS = 90;
// 1施設あたり一覧から拾う詳細ページ数の上限
const DEFAULT_MAX_LINKS = 6;

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const now = new Date();
const today = toDateString(now);
const upcomingLimit = toDateString(
  new Date(Date.now() + UPCOMING_LIMIT_DAYS * 24 * 60 * 60 * 1000),
);

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 単施設デバッグモード(pnpm fetch-exhibitions <facilityId>)では詳細を出力する
const DEBUG = process.argv[2] != null;

interface FetchedPage {
  html: string;
  // リダイレクト後の最終URL(企画展が特設サイトへ転送されるケースがある)
  url: string;
}

// charset を見て文字列化する(古い美術館サイトは Shift_JIS / EUC-JP がある)
async function fetchHtml(url: string): Promise<FetchedPage | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": USER_AGENT, accept: "text/html,*/*" },
        redirect: "follow",
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) return null;
      const buf = new Uint8Array(await res.arrayBuffer());
      const head = new TextDecoder("latin1").decode(buf.slice(0, 2048));
      const contentType = res.headers.get("content-type") ?? "";
      const charset =
        /charset=["']?([\w-]+)/i.exec(contentType)?.[1] ??
        /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)?.[1] ??
        "utf-8";
      let html: string;
      try {
        html = new TextDecoder(charset.toLowerCase()).decode(buf);
      } catch {
        html = new TextDecoder("utf-8").decode(buf);
      }
      return { html, url: res.url || url };
    } catch {
      await sleep(1000);
    }
  }
  return null;
}

// <meta property="og:xxx" content="..."> を属性順によらず取り出す。
// サイト共通OGPとページ固有OGPが両方あるサイトがあるため、最後の定義を採用する
function metaContent(html: string, prop: string): string | null {
  const metaTags = html.match(/<meta\s[^>]*>/gi) ?? [];
  let found: string | null = null;
  for (const tag of metaTags) {
    const propMatch = /(?:property|name)\s*=\s*["']([^"']+)["']/i.exec(tag);
    if (propMatch?.[1] !== prop) continue;
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag);
    if (content?.[1]) found = decodeEntities(content[1]);
  }
  return found;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)));
}

// 全角数字・令和表記を正規化する(会期を全角や和暦で書くサイトがある)
function normalizeDates(s: string): string {
  return s
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/令和\s*(\d+)\s*年/g, (_, n) => `${2018 + Number(n)}年`);
}

// HTMLからテキストだけを取り出す(日付抽出用)
function htmlToText(html: string): string {
  return normalizeDates(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " "),
  );
}

// 「2026.7.11［土］－ 9.23」のようなタイトル先頭の会期表記
const LEADING_DATE =
  /^\d{4}\s*[./年]\s*\d{1,2}\s*[./月]\s*\d{1,2}日?\s*(?:[［[(（][^)\]）］\s]{1,4}[)\]）］])?\s*[〜～\-−–—―－]*\s*(?:\d{1,2}\s*[./月]\s*\d{1,2}日?\s*(?:[［[(（][^)\]）］\s]{1,4}[)\]）］])?)?\s*/;

// サイト名サフィックスや会期プレフィックスを落とし、空白を正規化する
function cleanTitle(title: string, segment = 0): string {
  const parts = normalizeDates(title.replace(/\s+/g, " ")).split(/\s*[|｜]\s*/);
  return (parts[segment] ?? parts[0]!)
    .replace(
      /\s*[-–—―]\s*(公式|[^-–—―]*(美術館|ミュージアム|Museum|MUSEUM)[^-–—―]*)[-–—―]?\s*$/,
      "",
    )
    .replace(/^展覧会\s*[:：]\s*/, "")
    .replace(/\s*[(（]展覧会[)）]\s*$/, "")
    .replace(LEADING_DATE, "")
    .trim();
}

interface DateRange {
  startDate?: string;
  endDate?: string;
}

const YMD = "(\\d{4})\\s*[年./]\\s*(\\d{1,2})\\s*[月./]\\s*(\\d{1,2})\\s*日?";
const MD = "(\\d{1,2})\\s*[月./]\\s*(\\d{1,2})\\s*日?";
// 曜日・祝日注記 (土) (水・祝) [月･祝] など
const WD = "(?:\\s*[(\\[（［][^)\\]）］]{1,8}[)\\]）］])?";
const SEP = "\\s*(?:[〜～\\-−–—‐―─－]+|から|より)\\s*";

function pad(n: string): string {
  return n.padStart(2, "0");
}

// 「2026年7月5日(土)〜9月23日(水)」「2026.7.5-2026.9.23」等の会期表記を探す。
// allowNoYear は「会期」ラベル直後など確度の高い文脈のみ true(年は今年とみなす)
function findRange(text: string, allowNoYear: boolean): DateRange {
  const full = new RegExp(`${YMD}${WD}${SEP}(?:${YMD}|${MD})${WD}`);
  const m = full.exec(text);
  if (m) {
    const [, y1, mo1, d1, y2, mo2, d2, mo3, d3] = m;
    const start = `${y1}-${pad(mo1!)}-${pad(d1!)}`;
    let end: string;
    if (y2 != null) {
      end = `${y2}-${pad(mo2!)}-${pad(d2!)}`;
    } else {
      // 終了側の年が省略されている場合、開始月より小さければ年跨ぎとみなす
      const endYear = Number(mo3) < Number(mo1) ? Number(y1) + 1 : Number(y1);
      end = `${endYear}-${pad(mo3!)}-${pad(d3!)}`;
    }
    return { startDate: start, endDate: end };
  }

  // 「2026年7月7日(火)から」のような開始日のみの表記
  const startOnly = new RegExp(`${YMD}${WD}\\s*(?:から|より|開幕|スタート)`);
  const s = startOnly.exec(text);
  if (s) {
    const [, y, mo, d] = s;
    return { startDate: `${y}-${pad(mo!)}-${pad(d!)}` };
  }

  // 年が書かれていない「5月29日(金)〜8月12日(水)」形式
  if (allowNoYear) {
    const mdRange = new RegExp(`${MD}${WD}${SEP}${MD}${WD}`);
    const n = mdRange.exec(text);
    if (n) {
      const [, mo1, d1, mo2, d2] = n;
      const y1 = now.getFullYear();
      const y2 = Number(mo2) < Number(mo1) ? y1 + 1 : y1;
      return {
        startDate: `${y1}-${pad(mo1!)}-${pad(d1!)}`,
        endDate: `${y2}-${pad(mo2!)}-${pad(d2!)}`,
      };
    }
  }
  return {};
}

export function extractDateRange(text: string, noYearDates = false): DateRange {
  // まず「会期」「開催期間」等のラベル近傍を優先して探す(更新日などの誤検出を避ける)
  for (const m of text.matchAll(/(?:会期|開催期間|開催日程|期間)[::]?\s*/g)) {
    const snippet = text.slice(m.index, m.index + 130);
    const range = findRange(snippet, true);
    if (range.startDate || range.endDate) return range;
  }
  return findRange(text, noYearDates);
}

// 一覧ページから展覧会詳細ページのURLを抽出する(HTMLのhrefとJSONの"url"キー両対応)
export function extractLinks(
  html: string,
  baseUrl: string,
  source: ExhibitionSource,
  seen: Set<string>,
): string[] {
  const urls: string[] = [];
  const patterns = [
    /href\s*=\s*["']([^"'#]+)["']/gi,
    /"url"\s*:\s*"([^"]+)"/gi,
  ];
  for (const pattern of patterns) {
    for (const m of html.matchAll(pattern)) {
      let abs: string;
      try {
        abs = new URL(decodeEntities(m[1]!), baseUrl).toString();
      } catch {
        continue;
      }
      if (!source.linkPattern.test(abs)) continue;
      if (source.excludePattern?.test(abs)) continue;
      // WordPressのRSSフィード等は展覧会ページではない
      if (/\/feed\/?$/.test(abs)) continue;
      // 一覧ページ自身は除外
      if (normalizeUrl(abs) === normalizeUrl(baseUrl)) continue;
      if (seen.has(abs)) continue;
      seen.add(abs);
      urls.push(abs);
    }
  }
  return urls;
}

function normalizeUrl(u: string): string {
  return u.replace(/\/index\.html?$/, "").replace(/\/$/, "");
}

const IMG_NEGATIVE =
  /logo|icon|favicon|sns|facebook|twitter|instagram|youtube|line_|arrow|btn|nav|bnr|banner|common|header|footer|pixel|spacer|blank|xxxx|dummy|noimage|now_printing|access|ogp?[\w-]*\.(png|jpe?g|webp)$/i;
const IMG_POSITIVE =
  /chirashi|flyer|poster|visual|main|[_/-]mv|[_/-]kv|hero|exhibi|tenji|uploads?|upload_file|media|img\/2\d{3}/i;

// ロゴ・SNSアイコン等を避けつつ、ポスターらしい本文画像を推定する
function guessImage(html: string, pageUrl: string): string | undefined {
  // lazyload の data-src も見る
  for (const m of html.matchAll(
    /<img\s[^>]*?(?:data-src|src)\s*=\s*["']([^"']+)["']/gi,
  )) {
    let abs: string;
    try {
      abs = new URL(decodeEntities(m[1]!), pageUrl).toString();
    } catch {
      continue;
    }
    if (/\.svg(\?|$)/i.test(abs)) continue;
    if (IMG_NEGATIVE.test(abs)) continue;
    if (!IMG_POSITIVE.test(abs)) continue;
    return abs;
  }
  return undefined;
}

function extractTitle(html: string, source: ExhibitionSource): string | null {
  const finish = (t: string) =>
    source.titleStrip ? t.replace(source.titleStrip, "").trim() : t;
  if (source.titleRe) {
    const m = source.titleRe.exec(html);
    if (m?.[1]) {
      const t = cleanTitle(decodeEntities(htmlToText(m[1])));
      if (t) return finish(t);
    }
  }
  if (source.titleFrom !== "titleTag") {
    const og = metaContent(html, "og:title");
    if (og) {
      const t = cleanTitle(og);
      if (t) return finish(t);
    }
  }
  const titleTag = /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];
  if (titleTag) {
    const t = cleanTitle(decodeEntities(titleTag), source.titleSegment);
    if (t) return finish(t);
  }
  const h1 = /<h1[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1];
  if (h1) {
    const t = cleanTitle(decodeEntities(htmlToText(h1)));
    if (t) return finish(t);
  }
  return null;
}

function extractImage(
  html: string,
  pageUrl: string,
  source: ExhibitionSource,
): string | undefined {
  if (source.imageRe) {
    const m = source.imageRe.exec(html);
    if (m?.[1]) {
      try {
        return new URL(decodeEntities(m[1]), pageUrl).toString();
      } catch {
        return undefined;
      }
    }
  }
  let og: string | undefined;
  const ogRaw = metaContent(html, "og:image");
  if (ogRaw) {
    try {
      og = new URL(ogRaw, pageUrl).toString();
    } catch {
      og = undefined;
    }
  }
  // サイト共通のOGP画像(ロゴ等)らしければ本文画像を優先する
  if (og && !IMG_NEGATIVE.test(og)) return og;
  return guessImage(html, pageUrl) ?? og;
}

function buildExhibition(
  page: FetchedPage,
  source: ExhibitionSource,
): Exhibition | null {
  // リダイレクト先(ティザーページ等)が除外対象のこともある
  if (source.excludePattern?.test(page.url)) return null;
  const title = extractTitle(page.html, source);
  if (!title) return null;
  if (source.excludeTitle?.test(title)) return null;
  // 会期が og:description にしか無いサイトがあるため本文テキストの前に連結する
  const ogDesc = metaContent(page.html, "og:description") ?? "";
  const { startDate, endDate } = source.noDates
    ? {}
    : extractDateRange(
        `${normalizeDates(ogDesc)} ${htmlToText(page.html)}`,
        source.noYearDates,
      );
  if (source.requireDates && !startDate && !endDate) return null;
  return {
    facilityId: source.facilityId,
    title,
    url: page.url,
    imageUrl: extractImage(page.html, page.url, source),
    startDate,
    endDate,
  };
}

// 会期で開催中 or 近日開始のみ残す(会期不明は残す)
function isCurrentOrUpcoming(ex: Exhibition): boolean {
  if (ex.endDate && ex.endDate < today) return false;
  if (ex.startDate && ex.startDate > upcomingLimit) return false;
  return true;
}

async function fetchFacility(source: ExhibitionSource): Promise<Exhibition[]> {
  const listUrls = Array.isArray(source.listUrl)
    ? source.listUrl
    : [source.listUrl];

  // 一覧ページ自身が展覧会ページの施設(1ページ1展示・固定URL制)
  if (source.selfDetail) {
    const results: Exhibition[] = [];
    for (const url of listUrls) {
      const page = await fetchHtml(url);
      if (!page) {
        console.warn(`[${source.facilityId}] ページの取得に失敗: ${url}`);
        continue;
      }
      const ex = buildExhibition(page, source);
      if (ex && isCurrentOrUpcoming(ex)) results.push(ex);
      await sleep(300);
    }
    return results;
  }

  const seen = new Set<string>();
  const links: string[] = [];
  for (const listUrl of listUrls) {
    const listPage = await fetchHtml(listUrl);
    if (!listPage) {
      console.warn(`[${source.facilityId}] 一覧ページの取得に失敗: ${listUrl}`);
      continue;
    }
    links.push(...extractLinks(listPage.html, listPage.url, source, seen));
  }
  const capped = links.slice(0, source.maxLinks ?? DEFAULT_MAX_LINKS);
  if (capped.length === 0) {
    console.warn(`[${source.facilityId}] 展覧会リンクが見つからない`);
    return [];
  }
  if (DEBUG) console.warn(`links(${links.length}):`, capped);

  const results: Exhibition[] = [];
  const seenTitles = new Set<string>();
  for (const url of capped) {
    await sleep(300);
    const page = await fetchHtml(url);
    if (!page) {
      if (DEBUG) console.warn(`fetch失敗: ${url}`);
      continue;
    }
    const ex = buildExhibition(page, source);
    if (!ex) {
      if (DEBUG) console.warn(`抽出できず(タイトル/会期なし・除外): ${url}`);
      continue;
    }
    if (!isCurrentOrUpcoming(ex)) {
      if (DEBUG)
        console.warn(`会期外: ${ex.title} ${ex.startDate}〜${ex.endDate}`);
      continue;
    }
    if (seenTitles.has(ex.title)) continue;
    seenTitles.add(ex.title);
    results.push(ex);
  }
  return results;
}

// 施設単位で並行数を抑える簡易プール
async function runPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await fn(items[i]!);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

function loadPrevious(): ExhibitionData {
  try {
    return JSON.parse(readFileSync(OUT_PATH, "utf-8")) as ExhibitionData;
  } catch {
    return { updatedAt: "", exhibitions: [] };
  }
}

async function main() {
  // デバッグ用: `pnpm fetch-exhibitions <facilityId>` で1施設のみ取得して表示(書き込みなし)
  const only = process.argv[2];
  if (only) {
    const source = SOURCES.find((s) => s.facilityId === only);
    if (!source) {
      console.error(`unknown facilityId: ${only}`);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(await fetchFacility(source), null, 2));
    return;
  }

  const previous = loadPrevious();
  const prevByFacility = new Map<string, Exhibition[]>();
  for (const ex of previous.exhibitions) {
    const list = prevByFacility.get(ex.facilityId) ?? [];
    list.push(ex);
    prevByFacility.set(ex.facilityId, list);
  }

  const fetched = await runPool(SOURCES, 5, async (source) => {
    const list = await fetchFacility(source);
    if (list.length === 0 && prevByFacility.has(source.facilityId)) {
      // 取得失敗・0件時は前回分を維持(会期切れはフィルタで落ちる)
      console.warn(`[${source.facilityId}] 前回のデータを維持`);
      return prevByFacility.get(source.facilityId)!.filter(isCurrentOrUpcoming);
    }
    console.log(`[${source.facilityId}] ${list.length}件`);
    return list;
  });

  const exhibitions = [
    ...fetched.flat(),
    ...MANUAL_EXHIBITIONS.filter(isCurrentOrUpcoming),
  ];

  // 施設順→開始日順に安定ソートして差分を最小化する
  const order = new Map(SOURCES.map((s, i) => [s.facilityId, i]));
  exhibitions.sort(
    (a, b) =>
      (order.get(a.facilityId) ?? 999) - (order.get(b.facilityId) ?? 999) ||
      (a.startDate ?? "").localeCompare(b.startDate ?? "") ||
      a.title.localeCompare(b.title),
  );

  const unchanged =
    JSON.stringify(previous.exhibitions) === JSON.stringify(exhibitions);
  if (unchanged) {
    console.log("変更なし(exhibitions.json は更新しない)");
    return;
  }

  const data: ExhibitionData = { updatedAt: today, exhibitions };
  writeFileSync(OUT_PATH, `${JSON.stringify(data, null, 2)}\n`);
  console.log(`exhibitions.json を更新: ${exhibitions.length}件`);
}

await main();

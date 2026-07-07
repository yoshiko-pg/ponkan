import type { Category } from "./types";
import { CATEGORIES, CATEGORY_LABEL } from "./types";

// 年間振り返りのシェア画像をcanvasで生成する(1080×1080、アプリのライトテーマ配色)
const SIZE = 1080;
const PAD = 84;

const BG = "#f6f6f4";
const INK = "#17171a";
const INK_SOFT = "#75757f";
const ACCENT = "#ff6b2c";
const CAT_COLOR: Record<Category, string> = {
  aquarium: "#0284c7",
  art: "#db2777",
  museum: "#059669",
};

const FONT =
  "'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', system-ui, sans-serif";

// グリッドに並べるスタンプの上限。超えた分は「+N」で表す
const MAX_STAMPS = 20;

export interface RecapVisit {
  category: Category;
  date: string; // YYYY-MM-DD
  name: string; // 施設名
}

// セル幅に収まるように末尾を「…」で切り詰める
function truncateToWidth(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// facility.id と同じ発想の決定的な擬似乱数(再生成しても同じ見た目になる)
function wobble(i: number): number {
  return ((i * 137) % 15) - 7;
}

export async function generateRecapImage(
  year: number,
  visits: RecapVisit[],
): Promise<Blob> {
  const usedCategories = [...new Set(visits.map((v) => v.category))];
  const images = new Map(
    await Promise.all(
      usedCategories.map(async (c) => {
        const img = await loadImage(
          `${import.meta.env.BASE_URL}stamps/${c}.png`,
        );
        return [c, img] as const;
      }),
    ),
  );

  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, SIZE, SIZE);

  // ---- ヘッダー: ロゴと年 ----
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `italic 800 64px ${FONT}`;
  const logoY = PAD + 52;
  ctx.fillText("PONKAN", PAD, logoY);
  const logoW = ctx.measureText("PONKAN").width;
  ctx.fillStyle = ACCENT;
  ctx.beginPath();
  ctx.arc(PAD + logoW + 22, logoY - 8, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 32px ${FONT}`;
  ctx.textAlign = "right";
  ctx.fillText(`${year} RECAP`, SIZE - PAD, logoY - 6);
  ctx.textAlign = "left";

  // ---- スタンプグリッド ----
  const shownVisits = visits.slice(0, MAX_STAMPS);
  const overflow = visits.length - shownVisits.length;
  const cellCount = shownVisits.length + (overflow > 0 ? 1 : 0);
  const cols =
    cellCount <= 1
      ? 1
      : cellCount <= 4
        ? 2
        : cellCount <= 9
          ? 3
          : cellCount <= 16
            ? 4
            : 5;
  const rows = Math.max(1, Math.ceil(cellCount / cols));
  const gridTop = 200;
  const gridBottom = 880;
  const gridW = SIZE - PAD * 2;
  const cell = Math.min(gridW / cols, (gridBottom - gridTop) / rows);
  const offsetX = PAD + (gridW - cell * cols) / 2;
  const offsetY = gridTop + (gridBottom - gridTop - cell * rows) / 2;

  shownVisits.forEach((v, i) => {
    const cellLeft = offsetX + (i % cols) * cell;
    const cellTop = offsetY + Math.floor(i / cols) * cell;
    const cx = cellLeft + cell / 2;
    // 下に施設名を置くぶんスタンプは少し上に寄せる
    const stampCy = cellTop + cell * 0.42;
    const size = cell * 0.74;
    ctx.save();
    ctx.translate(cx, stampCy);
    ctx.rotate((wobble(i) * Math.PI) / 180);
    const img = images.get(v.category);
    if (img) ctx.drawImage(img, -size / 2, -size / 2, size, size);
    // スタンプ帳と同じく訪問日を中央に重ねる(絵柄の上でも読めるよう背景色で縁取る)
    const [, m, d] = v.date.split("-");
    const dateText = `${Number(m)}.${Number(d)}`;
    ctx.font = `700 ${Math.round(size * 0.14)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.lineJoin = "round";
    ctx.strokeStyle = BG;
    ctx.lineWidth = Math.max(3, size * 0.03);
    ctx.strokeText(dateText, 0, size * 0.05);
    ctx.fillStyle = CAT_COLOR[v.category];
    ctx.fillText(dateText, 0, size * 0.05);
    ctx.restore();

    // スタンプの下に施設名
    ctx.fillStyle = INK;
    ctx.font = `600 ${Math.max(18, Math.round(cell * 0.09))}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.fillText(
      truncateToWidth(ctx, v.name, cell * 0.96),
      cx,
      cellTop + cell * 0.92,
    );
  });

  if (overflow > 0) {
    const i = shownVisits.length;
    const cx = offsetX + (i % cols) * cell + cell / 2;
    const cy = offsetY + Math.floor(i / cols) * cell + cell * 0.42;
    ctx.fillStyle = INK_SOFT;
    ctx.font = `700 ${Math.round(cell * 0.22)}px ${FONT}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`+${overflow}`, cx, cy);
    ctx.textBaseline = "alphabetic";
  }

  // ---- フッター: カテゴリ別の内訳と合計 ----
  const counts = CATEGORIES.map((c) => ({
    category: c,
    count: visits.filter((v) => v.category === c).length,
  })).filter((e) => e.count > 0);

  const footerY = SIZE - PAD;
  let x = PAD;
  ctx.textAlign = "left";
  for (const e of counts) {
    ctx.fillStyle = CAT_COLOR[e.category];
    ctx.beginPath();
    ctx.arc(x + 9, footerY - 11, 9, 0, Math.PI * 2);
    ctx.fill();
    x += 30;
    ctx.fillStyle = INK_SOFT;
    ctx.font = `600 30px ${FONT}`;
    ctx.fillText(CATEGORY_LABEL[e.category], x, footerY);
    x += ctx.measureText(CATEGORY_LABEL[e.category]).width + 12;
    ctx.fillStyle = INK;
    ctx.font = `800 32px ${FONT}`;
    ctx.fillText(String(e.count), x, footerY);
    x += ctx.measureText(String(e.count)).width + 40;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = INK;
  ctx.font = `italic 800 96px ${FONT}`;
  ctx.fillText(String(visits.length), SIZE - PAD - 4, footerY + 6);
  const numW = ctx.measureText(String(visits.length)).width;
  ctx.fillStyle = INK_SOFT;
  ctx.font = `700 24px ${FONT}`;
  ctx.fillText("STAMPS", SIZE - PAD - numW - 24, footerY);
  ctx.textAlign = "left";

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("画像の生成に失敗しました"));
    }, "image/png");
  });
}

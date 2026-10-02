import type { CSSProperties } from "react";
import { CATEGORIES } from "../types";
import type { Category } from "../types";

interface Props {
  category: Category;
  // はじめて押すとき。ハンコが当たるまで紙に点線の的を残す
  fresh: boolean;
  // 節目やコンプリートでは粒を増やし、全カテゴリの粒を混ぜる
  big: boolean;
  // 押すたびに変わる値。粒の散り方を毎回変える
  seed: number;
}

// スタンプを押した瞬間の演出。ハンコが降りてきて紙に当たり、持ち上がって去る。
// 当たった瞬間にカテゴリごとの粒(水族館は泡、美術館は絵の具、博物館はきらめき)が飛ぶ
export function StampEffect({ category, fresh, big, seed }: Props) {
  const particles = makeParticles(category, big, seed);
  return (
    <span className="stamp-fx" aria-hidden="true">
      {fresh && <span className="fx-target" />}
      <span className="fx-ring" />
      {big && <span className="fx-ring late" />}
      <Hanko />
      {particles.map((p, i) => (
        <i key={i} className={`fx-p fx-${p.kind}`} style={p.style} />
      ))}
      <span className={`fx-pon ${big ? "big" : ""}`}>
        {big ? "ポーン!" : "ポン!"}
      </span>
    </span>
  );
}

// 斜め上から見た木の台のハンコ。持ち手はポンカン。
// ゴム面(下端の楕円)の中心が (56, 88) で、ここをスタンプの円の中心付近に合わせる
function Hanko() {
  return (
    <svg className="fx-hanko" width="112" height="128" viewBox="0 0 112 128">
      <path
        className="hanko-side"
        d="M8 72V84A48 38 0 0 0 104 84V72A48 38 0 0 1 8 72Z"
      />
      <path
        className="hanko-rubber"
        d="M8 84V88A48 38 0 0 0 104 88V84A48 38 0 0 1 8 84Z"
      />
      <ellipse className="hanko-top" cx="56" cy="72" rx="48" ry="38" />
      <ellipse className="hanko-bevel" cx="56" cy="70" rx="43" ry="33" />
      <path className="hanko-neck" d="M47 36V72A9 7 0 0 0 65 72V36Z" />
      <path
        className="hanko-neck-light"
        d="M50 36V77.2A9 7 0 0 0 54 78.8V36Z"
      />
      <circle cx="56" cy="26" r="19" fill="#e4571d" />
      <circle cx="54.2" cy="24.2" r="16.5" fill="#ff6b2c" />
      <ellipse
        cx="48"
        cy="17"
        rx="5"
        ry="3.4"
        fill="#fff"
        opacity="0.55"
        transform="rotate(-35 48 17)"
      />
      <path
        d="M56 8L57 2.5"
        stroke="#6b4a2b"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M57 5.5C61 0 68 -1.5 74 0.5C70 6 63 8 57 5.5Z" fill="#3f9a4a" />
    </svg>
  );
}

type ParticleKind = "bubble" | "paint" | "sparkle";

const PARTICLE_KIND: Record<Category, ParticleKind> = {
  aquarium: "bubble",
  art: "paint",
  museum: "sparkle",
};

const PAINT_COLORS = [
  "var(--art)",
  "var(--art)",
  "var(--accent)",
  "#facc15",
  "#a78bfa",
];
const SPARKLE_COLORS = ["var(--museum)", "var(--museum)", "#f59e0b", "#fbbf24"];
const BLOB_SHAPES = [
  "50%",
  "60% 40% 55% 45% / 50% 60% 40% 50%",
  "45% 55% 50% 50% / 60% 40% 60% 40%",
];

interface Particle {
  kind: ParticleKind;
  style: CSSProperties;
}

// 粒の動きはCSSのキーフレームで、ここでは出発点・行き先・大きさなどを変数として渡す
function makeParticles(
  category: Category,
  big: boolean,
  seed: number,
): Particle[] {
  const rand = mulberry32(seed);
  const between = (min: number, max: number) => min + rand() * (max - min);
  const pick = <T,>(items: T[]) => items[Math.floor(rand() * items.length)];
  const px = (n: number) => `${Math.round(n)}px`;
  const ms = (n: number) => `${Math.round(n)}ms`;
  const kinds = big
    ? CATEGORIES.map((c) => PARTICLE_KIND[c])
    : [PARTICLE_KIND[category]];
  const reach = big ? 1.25 : 1;

  return Array.from({ length: big ? 30 : 16 }, (_, i) => {
    const kind = kinds[i % kinds.length];
    if (kind === "bubble") {
      // 泡: ハンコの左右の縁から、左右に揺れながら浮かび上がる
      const side = rand() < 0.5 ? 0 : Math.PI;
      const angle = side + between(-0.45, 0.45);
      const x0 = Math.cos(angle) * between(42, 56);
      const y0 = Math.sin(angle) * between(42, 56);
      const y1 = y0 - between(50, 110) * reach;
      return {
        kind,
        style: {
          "--x0": px(x0),
          "--y0": px(y0),
          "--mx": px(x0 + between(-14, 14)),
          "--my": px((y0 + y1) / 2),
          "--x1": px(x0 + between(-18, 18)),
          "--y1": px(y1),
          "--s": px(between(6, 14)),
          "--dur": ms(between(900, 1400)),
          "--d": ms(between(0, 240)),
          color: "var(--aquarium)",
        } as CSSProperties,
      };
    }

    // 絵の具ときらめき: 縁から放射状に飛ぶ。絵の具は最後に少し垂れ落ちる
    const angle = between(0, Math.PI * 2);
    const start = between(34, 46);
    const dist = start + between(26, 64) * reach;
    const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
    const fall = kind === "paint" ? between(8, 20) : 0;
    return {
      kind,
      style: {
        "--x0": px(cos * start),
        "--y0": px(sin * start),
        "--mx": px(cos * (start + (dist - start) * 0.8)),
        "--my": px(sin * (start + (dist - start) * 0.8)),
        "--x1": px(cos * dist),
        "--y1": px(sin * dist + fall),
        "--r": `${Math.round(between(-200, 200))}deg`,
        "--s": px(kind === "paint" ? between(5, 12) : between(9, 16)),
        "--dur": ms(between(700, 1000)),
        "--d": ms(between(0, kind === "paint" ? 60 : 160)),
        "--br": pick(BLOB_SHAPES),
        color: pick(kind === "paint" ? PAINT_COLORS : SPARKLE_COLORS),
      } as CSSProperties,
    };
  });
}

// 種から決まる擬似乱数。再レンダーしても同じ散り方のまま、押すたびには違う散り方になる
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

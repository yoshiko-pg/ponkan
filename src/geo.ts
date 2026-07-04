import type { HomePoint } from "./types";

// ハバーサイン公式による2点間の直線距離(km)
export function distanceKm(a: HomePoint, b: HomePoint): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function formatKm(km: number): string {
  return km < 10 ? `${km.toFixed(1)}km` : `${Math.round(km)}km`;
}

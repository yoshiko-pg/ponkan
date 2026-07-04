import { CATEGORY_EMOJI } from "../types";
import type { Facility, VisitRecord } from "../types";

function shortDate(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(m)}/${Number(d)}`;
}

interface Props {
  facility: Facility;
  visit?: VisitRecord;
  onClick: () => void;
}

export function StampCircle({ facility, visit, onClick }: Props) {
  const rotation = (hash(facility.id) % 13) - 6;
  return (
    <button className="stamp-cell" onClick={onClick} type="button">
      <span
        className={`stamp-circle cat-${facility.category} ${visit ? "stamped" : ""}`}
        style={visit ? { transform: `rotate(${rotation}deg)` } : undefined}
      >
        <span className="stamp-emoji">{CATEGORY_EMOJI[facility.category]}</span>
        {visit && <span className="stamp-date">{shortDate(visit.date)}</span>}
      </span>
      <span className={`stamp-name ${visit ? "" : "unvisited"}`}>
        {facility.name}
      </span>
    </button>
  );
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

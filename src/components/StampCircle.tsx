import { CATEGORY_CODE, TIER_LABEL } from "../types";
import { formatDateLines } from "../format";
import type { Facility, VisitRecord } from "../types";
import { formatKm } from "../geo";

interface Props {
  facility: Facility;
  visit?: VisitRecord;
  distance?: number | null;
  onClick: () => void;
}

export function StampCircle({ facility, visit, distance, onClick }: Props) {
  const rotation = (hash(facility.id) % 13) - 6;
  return (
    <button className="stamp-cell" onClick={onClick} type="button">
      <span
        className={`stamp-circle cat-${facility.category} ${visit ? "stamped" : ""}`}
        style={visit ? { transform: `rotate(${rotation}deg)` } : undefined}
      >
        <span className="stamp-code">{CATEGORY_CODE[facility.category]}</span>
        {visit && (
          <span className="stamp-date">
            {formatDateLines(visit.date).map((line) => (
              <span key={line}>{line}</span>
            ))}
          </span>
        )}
      </span>
      <span className={`stamp-name ${visit ? "" : "unvisited"}`}>
        {facility.name}
      </span>
      {(facility.tier != null || distance != null) && (
        <span className="stamp-dist">
          {facility.tier != null && (
            <span className="stamp-tier">{TIER_LABEL[facility.tier]}</span>
          )}
          {facility.tier != null && distance != null && " ・ "}
          {distance != null && formatKm(distance)}
        </span>
      )}
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

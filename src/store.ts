import { useCallback, useEffect, useMemo, useState } from "react";
import { SEED_FACILITIES } from "./data/facilities";
import { DEFAULT_RANGE_KM, RANGE_OPTIONS } from "./types";
import type { Facility, HomePoint, StoreData, VisitRecord } from "./types";

const STORAGE_KEY = "ponkan:v1";
const LAST_BACKUP_KEY = "ponkan:lastBackup";

// これ以上バックアップしていない期間が続いたらリマインドを出す
const BACKUP_STALE_MS = 60 * 24 * 60 * 60 * 1000;

const EMPTY: StoreData = {
  visits: {},
  custom: [],
  hidden: [],
  home: null,
  rangeKm: null,
  expoBookmarks: [],
};

// 選択肢の変更(60km→50kmなど)で無効になった保存値を近い選択肢に丸める
function normalizeRangeKm(rangeKm: number | null | undefined): number | null {
  if (rangeKm == null) return null;
  if (RANGE_OPTIONS.includes(rangeKm)) return rangeKm;
  return RANGE_OPTIONS.reduce((a, b) =>
    Math.abs(b - rangeKm) < Math.abs(a - rangeKm) ? b : a,
  );
}

function load(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      visits: parsed.visits ?? {},
      custom: parsed.custom ?? [],
      hidden: parsed.hidden ?? [],
      home: parsed.home ?? null,
      rangeKm: normalizeRangeKm(parsed.rangeKm),
      expoBookmarks: parsed.expoBookmarks ?? [],
    };
  } catch {
    return EMPTY;
  }
}

function today(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function useStore() {
  const [data, setData] = useState<StoreData>(load);
  const [lastBackupAt, setLastBackupAt] = useState<number | null>(() => {
    const raw = localStorage.getItem(LAST_BACKUP_KEY);
    const ts = raw ? Number(raw) : NaN;
    return Number.isFinite(ts) ? ts : null;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // ブラウザにストレージの永続化を頼む(iOS Safariの自動削除などへの防御)
  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  const markBackedUp = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_BACKUP_KEY, String(now));
    setLastBackupAt(now);
  }, []);

  const facilities: Facility[] = useMemo(
    () => [
      ...SEED_FACILITIES.filter((f) => !data.hidden.includes(f.id)),
      ...data.custom,
    ],
    [data.custom, data.hidden],
  );

  const stamp = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      visits: { ...d.visits, [id]: { date: today(), memo: "" } },
    }));
  }, []);

  const unstamp = useCallback((id: string) => {
    setData((d) => {
      const visits = { ...d.visits };
      delete visits[id];
      return { ...d, visits };
    });
  }, []);

  const updateVisit = useCallback((id: string, patch: Partial<VisitRecord>) => {
    setData((d) => {
      const cur = d.visits[id];
      if (!cur) return d;
      return { ...d, visits: { ...d.visits, [id]: { ...cur, ...patch } } };
    });
  }, []);

  const removeFacility = useCallback((id: string) => {
    setData((d) => {
      const visits = { ...d.visits };
      delete visits[id];
      const isCustom = d.custom.some((f) => f.id === id);
      return {
        ...d,
        visits,
        custom: isCustom ? d.custom.filter((f) => f.id !== id) : d.custom,
        hidden: isCustom ? d.hidden : [...d.hidden, id],
      };
    });
  }, []);

  const setHome = useCallback((home: HomePoint | null) => {
    // 基準地点を設定したら絞り込みは50kmから始める(解除したらリセット)
    setData((d) => ({
      ...d,
      home,
      rangeKm: home ? (d.rangeKm ?? DEFAULT_RANGE_KM) : null,
    }));
  }, []);

  const setRangeKm = useCallback((rangeKm: number | null) => {
    setData((d) => ({ ...d, rangeKm }));
  }, []);

  // 特別展のブックマークをトグルする(キーは展覧会ページのURL)
  const toggleExpoBookmark = useCallback((url: string) => {
    setData((d) => ({
      ...d,
      expoBookmarks: d.expoBookmarks.includes(url)
        ? d.expoBookmarks.filter((u) => u !== url)
        : [...d.expoBookmarks, url],
    }));
  }, []);

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ponkan-backup-${today()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    markBackedUp();
  }, [data, markBackedUp]);

  const importJson = useCallback(
    (text: string): boolean => {
      try {
        const parsed = JSON.parse(text) as Partial<StoreData>;
        if (typeof parsed !== "object" || parsed === null || !parsed.visits) {
          return false;
        }
        setData({
          visits: parsed.visits ?? {},
          custom: parsed.custom ?? [],
          hidden: parsed.hidden ?? [],
          home: parsed.home ?? null,
          rangeKm: normalizeRangeKm(parsed.rangeKm),
          expoBookmarks: parsed.expoBookmarks ?? [],
        });
        // インポート直後はデータがJSONファイルとして手元にある状態なのでバックアップ済み扱い
        markBackedUp();
        return true;
      } catch {
        return false;
      }
    },
    [markBackedUp],
  );

  // 訪問記録があるのにバックアップが古い(または一度もない)とき true
  const backupStale =
    Object.keys(data.visits).length > 0 &&
    (lastBackupAt == null || Date.now() - lastBackupAt > BACKUP_STALE_MS);

  return {
    facilities,
    visits: data.visits,
    home: data.home,
    rangeKm: data.rangeKm,
    expoBookmarks: data.expoBookmarks,
    lastBackupAt,
    backupStale,
    setHome,
    setRangeKm,
    toggleExpoBookmark,
    stamp,
    unstamp,
    updateVisit,
    removeFacility,
    exportJson,
    importJson,
  };
}

export type Store = ReturnType<typeof useStore>;

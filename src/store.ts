import { useCallback, useEffect, useMemo, useState } from "react";
import { SEED_FACILITIES } from "./data/facilities";
import type { Facility, StoreData, VisitRecord } from "./types";

const STORAGE_KEY = "ponkan:v1";

const EMPTY: StoreData = { visits: {}, custom: [], hidden: [] };

function load(): StoreData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return {
      visits: parsed.visits ?? {},
      custom: parsed.custom ?? [],
      hidden: parsed.hidden ?? [],
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

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

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

  const addFacility = useCallback((f: Omit<Facility, "id" | "custom">) => {
    const id = `custom-${Math.random().toString(36).slice(2, 10)}`;
    setData((d) => ({
      ...d,
      custom: [...d.custom, { ...f, id, custom: true }],
    }));
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
  }, [data]);

  const importJson = useCallback((text: string): boolean => {
    try {
      const parsed = JSON.parse(text) as Partial<StoreData>;
      if (typeof parsed !== "object" || parsed === null || !parsed.visits) {
        return false;
      }
      setData({
        visits: parsed.visits ?? {},
        custom: parsed.custom ?? [],
        hidden: parsed.hidden ?? [],
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    facilities,
    visits: data.visits,
    stamp,
    unstamp,
    updateVisit,
    addFacility,
    removeFacility,
    exportJson,
    importJson,
  };
}

export type Store = ReturnType<typeof useStore>;

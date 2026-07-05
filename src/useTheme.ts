import { useCallback, useEffect, useState } from "react";

export type Theme = "dark" | "light";

const KEY = "ponkan:theme";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem(KEY) === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(KEY, theme);
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#101013" : "#f6f6f4");
  }, [theme]);

  const toggle = useCallback(
    () => setTheme((t) => (t === "dark" ? "light" : "dark")),
    [],
  );

  return { theme, toggle };
}

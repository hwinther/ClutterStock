import { useState, useEffect } from "react";

export type ThemeId = "system" | "tui" | "win98" | "cde";

export function useTheme(): ThemeId {
  const [theme, setTheme] = useState<ThemeId>("system");

  useEffect(() => {
    const read = () =>
      setTheme((document.documentElement.getAttribute("data-theme") as ThemeId) || "system");

    read();

    const obs = new MutationObserver(read);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => obs.disconnect();
  }, []);

  return theme;
}

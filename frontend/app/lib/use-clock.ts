import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void): () => void {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

function readTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/** The current local time as hh:mm, refreshed every 30 seconds. Empty during SSR and hydration. */
export function useClock(): string {
  return useSyncExternalStore(subscribe, readTime, () => "");
}

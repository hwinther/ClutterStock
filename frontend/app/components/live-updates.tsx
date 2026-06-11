import { useEffect, useRef } from "react";
import { useRevalidator } from "react-router";

/**
 * Subscribes to the server's item-change SSE stream (`/sse/items`) and
 * revalidates the active route loaders so the UI reflects changes made by other
 * users without a manual reload. Renders nothing and is browser-only — the
 * effect (and `EventSource`) never run during SSR.
 */
export function LiveUpdates({ enabled }: { readonly enabled: boolean }) {
  const revalidator = useRevalidator();
  // Stable ref so the connection effect doesn't reconnect when the revalidator
  // identity changes; synced in its own effect (never written during render).
  const revalidateRef = useRef(revalidator.revalidate);
  useEffect(() => {
    revalidateRef.current = revalidator.revalidate;
  }, [revalidator.revalidate]);

  useEffect(() => {
    if (!enabled) return;

    let debounce: ReturnType<typeof setTimeout> | undefined;
    const source = new EventSource("/sse/items");

    const onChange = () => {
      // Coalesce bursts (e.g. several quick edits) into one revalidation.
      clearTimeout(debounce);
      debounce = setTimeout(() => revalidateRef.current(), 250);
    };
    source.addEventListener("item-change", onChange);

    return () => {
      clearTimeout(debounce);
      source.removeEventListener("item-change", onChange);
      source.close();
    };
  }, [enabled]);

  return null;
}

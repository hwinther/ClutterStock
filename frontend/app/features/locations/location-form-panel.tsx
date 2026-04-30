import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { LocationResponse } from "~/api/client";
import { FormField, PanelHeader } from "~/components/panel-ui";
import { inputStyle } from "~/lib/styles";

type ActionData =
  | { ok: true; intent: "create-location"; location: LocationResponse }
  | { ok: false; error: string };

export function LocationFormPanel({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (loc: LocationResponse) => void;
}) {
  const fetcher = useFetcher<ActionData>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const submitting = fetcher.state !== "idle";

  const actionError = fetcher.state === "idle" && fetcher.data && !fetcher.data.ok
    ? fetcher.data.error : null;
  const error = validationError ?? actionError;

  const onCreatedRef = useRef(onCreated);
  useEffect(() => { onCreatedRef.current = onCreated; });

  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetcher.state === "submitting") { fetchedRef.current = true; return; }
    if (!fetchedRef.current || fetcher.state !== "idle" || !fetcher.data) return;
    fetchedRef.current = false;
    const data = fetcher.data;
    if (!data.ok) return;
    onCreatedRef.current(data.location);
  }, [fetcher.state, fetcher.data]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string ?? "").trim();
    if (!name) { setValidationError("Name is required."); return; }
    setValidationError(null);
    fetcher.submit(fd, { method: "post" });
  }

  return (
    <aside className="tui-panel" style={{
      width: 340, borderLeft: "1px solid var(--c-border)",
      background: "var(--c-bg-2)", flexShrink: 0,
      display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <span className="tui-panel-title">─[ new location ]─</span>
      <PanelHeader label="NEW LOCATION" onClose={onClose} />
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16 }}>
        <input type="hidden" name="_intent" value="create-location" />
        {error && <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>{error}</div>}
        <FormField label="Name *">
          <input name="name" type="text" required autoFocus placeholder="e.g. Home, Storage Unit" style={inputStyle} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" rows={2} placeholder="e.g. Main house on Oak Street" style={{ ...inputStyle, resize: "vertical" }} />
        </FormField>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting} style={{
            flex: 1, padding: "8px 14px", borderRadius: 6, border: "none",
            background: "var(--c-accent)", color: "#fff", fontSize: 13, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit",
          }}>
            {submitting ? "Creating…" : "Create location"}
          </button>
          <button type="button" onClick={onClose} disabled={submitting} style={{
            padding: "8px 14px", borderRadius: 6, border: "1px solid var(--c-border)",
            background: "transparent", color: "var(--c-fg-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--c-fg-3)", margin: 0 }}>
          After creating the location you&apos;ll be able to add a room.
        </p>
      </form>
    </aside>
  );
}

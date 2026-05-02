import { useEffect, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";
import { FormField, PanelHeader } from "~/components/panel-ui";
import { inputStyle } from "~/lib/styles";

type ActionData =
  | { ok: true; intent: "create-item" | "update-item"; item: ItemResponse }
  | { ok: true; intent: "delete-item" }
  | { ok: false; error: string };

export function ItemEditPanel({ item, rooms, locations, defaultRoomId, onClose, onSaved, onDeleted, onNewRoom }: {
  item?: ItemResponse;
  rooms: RoomResponse[];
  locations: LocationResponse[];
  defaultRoomId?: number;
  onClose: () => void;
  onSaved: (saved: ItemResponse) => void;
  onDeleted: () => void;
  onNewRoom?: (locationId?: number) => void;
}) {
  const fetcher = useFetcher<ActionData>();
  const [validationError, setValidationError] = useState<string | null>(null);
  const isNew = !item;
  const submitting = fetcher.state !== "idle";
  const locationById = Object.fromEntries(locations.map(l => [l.id!, l]));

  // Derive server-side error from fetcher result during render (no setState needed)
  const actionError = fetcher.state === "idle" && fetcher.data && !fetcher.data.ok
    ? fetcher.data.error : null;
  const error = validationError ?? actionError;

  const onSavedRef = useRef(onSaved);
  const onDeletedRef = useRef(onDeleted);
  useEffect(() => { onSavedRef.current = onSaved; onDeletedRef.current = onDeleted; });

  // Only call success callbacks — no setState here (error is derived in render)
  const fetchedRef = useRef(false);
  useEffect(() => {
    if (fetcher.state === "submitting") { fetchedRef.current = true; return; }
    if (!fetchedRef.current || fetcher.state !== "idle" || !fetcher.data) return;
    fetchedRef.current = false;
    const data = fetcher.data;
    if (!data.ok) return;
    if (data.intent === "create-item" || data.intent === "update-item") onSavedRef.current(data.item);
    else if (data.intent === "delete-item") onDeletedRef.current();
  }, [fetcher.state, fetcher.data]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string ?? "").trim();
    if (!name) { setValidationError("Name is required."); return; }
    setValidationError(null);
    fetcher.submit(fd, { method: "post" });
  }

  function handleDelete() {
    if (!item?.id || !confirm("Delete this item?")) return;
    fetcher.submit(
      { _intent: "delete-item", itemId: String(item.id) },
      { method: "post" },
    );
  }

  return (
    <aside className="tui-panel" style={{
      width: 340, borderLeft: "1px solid var(--c-border)",
      background: "var(--c-bg-2)", flexShrink: 0,
      display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <span className="tui-panel-title">{isNew ? "─[ new item ]─" : `─[ edit · #${item.id} ]─`}</span>
      <PanelHeader
        label={isNew ? "NEW ITEM" : `EDIT ITEM #${item.id}`}
        onClose={onClose}
      />

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 0", flex: 1 }}>
        <input type="hidden" name="_intent" value={isNew ? "create-item" : "update-item"} />
        {!isNew && <input type="hidden" name="itemId" value={item.id} />}

        {error && (
          <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>
            {error}
          </div>
        )}

        {isNew && (
          <FormField label="Room">
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <select name="roomId" defaultValue={defaultRoomId ?? rooms[0]?.id ?? ""} style={{ ...inputStyle, flex: 1 }}>
                {locations.map(loc => {
                  const locRooms = rooms.filter(r => r.locationId === loc.id);
                  if (locRooms.length === 0) return null;
                  return (
                    <optgroup key={loc.id} label={loc.name ?? "Location"}>
                      {locRooms.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
              {onNewRoom && (
                <button
                  type="button"
                  onClick={() => onNewRoom()}
                  title="New room"
                  style={{
                    flexShrink: 0, padding: "7px 10px", borderRadius: 6, fontSize: 13,
                    border: "1px solid var(--c-border)", background: "var(--c-bg-3)",
                    color: "var(--c-fg-2)", cursor: "pointer", fontFamily: "inherit",
                  }}
                >＋</button>
              )}
            </div>
          </FormField>
        )}

        {!isNew && item.roomId != null && (
          <>
            {/* Backend's UpdateItemRequest requires RoomId>=1; the read-only display
                wouldn't post a value, so carry it through with a hidden input. */}
            <input type="hidden" name="roomId" value={item.roomId} />
            <FormField label="Room">
              <div style={{ ...inputStyle, color: "var(--c-fg-2)", cursor: "default" }}>
                {(() => {
                  const room = rooms.find(r => r.id === item.roomId);
                  const loc = room?.locationId != null ? locationById[room.locationId] : null;
                  return loc ? `${loc.name} / ${room?.name}` : (room?.name ?? "—");
                })()}
              </div>
            </FormField>
          </>
        )}

        <FormField label="Name *">
          <input
            name="name" type="text" required autoFocus
            defaultValue={item?.name ?? ""}
            placeholder="e.g. Vintage Lamp"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Description">
          <textarea
            name="description" rows={2}
            defaultValue={item?.description ?? ""}
            placeholder="e.g. Brass table lamp, 1980s"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </FormField>

        <FormField label="Category">
          <input
            name="category" type="text"
            defaultValue={item?.category ?? ""}
            placeholder="e.g. Electronics, Furniture"
            style={inputStyle}
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            name="notes" rows={3}
            defaultValue={item?.notes ?? ""}
            placeholder="e.g. Needs new shade"
            style={{ ...inputStyle, resize: "vertical" }}
          />
        </FormField>

        <div style={{ display: "flex", gap: 8, paddingBottom: 4 }}>
          <button
            type="submit" disabled={submitting}
            style={{
              flex: 1, padding: "8px 14px", borderRadius: 6,
              border: "none", background: "var(--c-accent)", color: "#fff",
              fontSize: 13, fontWeight: 500, cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.7 : 1, fontFamily: "inherit",
            }}
          >
            {submitting ? "Saving…" : (isNew ? "Create item" : "Save changes")}
          </button>
          <button
            type="button" onClick={onClose} disabled={submitting}
            style={{
              padding: "8px 14px", borderRadius: 6,
              border: "1px solid var(--c-border)", background: "transparent",
              color: "var(--c-fg-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Cancel
          </button>
        </div>

        {!isNew && (
          <div style={{ marginTop: "auto", paddingTop: 16, paddingBottom: 20, borderTop: "1px solid var(--c-border)" }}>
            <button
              type="button" onClick={handleDelete} disabled={submitting}
              style={{
                width: "100%", padding: "7px 14px", borderRadius: 6,
                border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.07)",
                color: "#ef4444", fontSize: 13, cursor: submitting ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              Delete item
            </button>
          </div>
        )}
      </form>
    </aside>
  );
}

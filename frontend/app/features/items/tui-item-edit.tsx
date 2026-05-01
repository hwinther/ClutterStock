import { useEffect, useMemo, useRef, useState } from "react";
import { useFetcher } from "react-router";
import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";
import { TuiCombobox, type TuiComboboxOption } from "./tui-combobox";

type ActionData =
  | { ok: true; intent: "update-item"; item: ItemResponse }
  | { ok: true; intent: "delete-item" }
  | { ok: false; error: string };

export function TuiItemEdit({ item, rooms, locations, onCancel, onSaved, onDelete }: {
  item: ItemResponse;
  rooms: RoomResponse[];
  locations: LocationResponse[];
  onCancel: () => void;
  onSaved: (saved: ItemResponse) => void;
  onDelete: () => void;
}) {
  const fetcher = useFetcher<ActionData>();
  const submitting = fetcher.state !== "idle";
  const [validationError, setValidationError] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<number | null>(item.roomId ?? null);
  const formRef = useRef<HTMLFormElement>(null);

  const roomOptions = useMemo<TuiComboboxOption[]>(() => {
    const opts: TuiComboboxOption[] = [];
    for (const loc of locations) {
      const locRooms = rooms.filter(r => r.locationId === loc.id);
      if (locRooms.length === 0) continue;
      opts.push({ kind: "group", label: loc.name ?? "Location" });
      for (const r of locRooms) {
        opts.push({ kind: "option", label: r.name ?? "Room", value: r.id! });
      }
    }
    return opts;
  }, [rooms, locations]);

  const actionError = fetcher.state === "idle" && fetcher.data && !fetcher.data.ok
    ? fetcher.data.error : null;
  const error = validationError ?? actionError;

  const onSavedRef = useRef(onSaved);
  useEffect(() => { onSavedRef.current = onSaved; });

  const wasSubmittingRef = useRef(false);
  useEffect(() => {
    if (fetcher.state === "submitting") { wasSubmittingRef.current = true; return; }
    if (!wasSubmittingRef.current || fetcher.state !== "idle" || !fetcher.data) return;
    wasSubmittingRef.current = false;
    if (fetcher.data.ok && fetcher.data.intent === "update-item") {
      onSavedRef.current(fetcher.data.item);
    }
  }, [fetcher.state, fetcher.data]);

  function submitForm() {
    const form = formRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const name = (fd.get("name") as string ?? "").trim();
    if (!name) { setValidationError("name is required"); return; }
    setValidationError(null);
    fetcher.submit(fd, { method: "post" });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLFormElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "s" || e.key === "S")) {
      e.preventDefault();
      submitForm();
    }
  }

  return (
    <fetcher.Form
      method="post"
      ref={formRef}
      onKeyDown={handleKeyDown}
      onSubmit={(e) => { e.preventDefault(); submitForm(); }}
      className="tui-panel tui-detail tui-edit"
      style={{ flexShrink: 0, height: 200 }}
    >
      <span className="tui-panel-title">{`─[ edit · #${item.id} ]─`}</span>

      <input type="hidden" name="_intent" value="update-item" />
      <input type="hidden" name="itemId" value={item.id ?? ""} />

      <div className="tui-detail-grid tui-edit-grid">
        <EditField label="name" name="name" defaultValue={item.name ?? ""} autoFocus required />
        <EditField label="category" name="category" defaultValue={item.category ?? ""} />
        <div className="tui-detail-field tui-edit-row tui-edit-row--combo">
          <span className="tui-detail-label">{"room    "}</span>
          <span className="tui-detail-colon">:</span>{" "}
          <TuiCombobox
            name="roomId"
            value={roomId}
            options={roomOptions}
            onChange={setRoomId}
            disabled={submitting}
            ariaLabel="Room"
          />
        </div>
        <ReadField label="location" value={resolveLocationName(roomId, rooms, locations)} />
        <EditField label="desc"     name="description" defaultValue={item.description ?? ""} fullWidth />
        <div className="tui-detail-notes tui-edit-row">
          <span className="tui-detail-label">notes   </span>
          <span className="tui-detail-colon">:</span>{" "}
          <span className="tui-edit-bracket">[</span>
          <input
            type="text"
            name="notes"
            defaultValue={item.notes ?? ""}
            className="tui-edit-input"
            disabled={submitting}
          />
          <span className="tui-edit-bracket">]</span>
        </div>
      </div>

      {error && <div className="tui-edit-error">! {error}</div>}

      <div className="tui-detail-actions">
        <button type="submit" disabled={submitting} className="tui-detail-action">
          [^S] {submitting ? "saving…" : "save"}
        </button>
        <span className="tui-detail-sep">·</span>
        <button type="button" onClick={onCancel} disabled={submitting} className="tui-detail-action">
          [Esc] cancel
        </button>
        <span className="tui-detail-sep">·</span>
        <button
          type="button"
          onClick={onDelete}
          disabled={submitting}
          className="tui-detail-action tui-detail-action--danger"
        >
          [d] delete
        </button>
      </div>
    </fetcher.Form>
  );
}

function EditField({ label, name, defaultValue, autoFocus, required, fullWidth }: {
  label: string;
  name: string;
  defaultValue: string;
  autoFocus?: boolean;
  required?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <div className={`tui-detail-field tui-edit-row${fullWidth ? " tui-edit-row--full" : ""}`}>
      <span className="tui-detail-label">{label.padEnd(8, " ")}</span>
      <span className="tui-detail-colon">:</span>{" "}
      <span className="tui-edit-bracket">[</span>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        required={required}
        className="tui-edit-input"
      />
      <span className="tui-edit-bracket">]</span>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="tui-detail-field">
      <span className="tui-detail-label">{label.padEnd(8, " ")}</span>
      <span className="tui-detail-colon">:</span>{" "}
      <span className="tui-detail-value">{value}</span>
    </div>
  );
}

function resolveLocationName(
  roomId: number | null,
  rooms: RoomResponse[],
  locations: LocationResponse[],
): string {
  if (roomId == null) return "—";
  const room = rooms.find(r => r.id === roomId);
  if (!room || room.locationId == null) return "—";
  const loc = locations.find(l => l.id === room.locationId);
  return loc?.name ?? "—";
}

import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";
import { relativeTime } from "~/lib/time";

export function TuiItemDetail({ item, room, location, onEdit, onDelete }: {
  item: ItemResponse;
  room?: RoomResponse | null;
  location?: LocationResponse | null;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="tui-panel tui-detail" style={{ flexShrink: 0, height: 140 }}>
      <span className="tui-panel-title">{`─[ detail · #${item.id} ]─`}</span>

      <div className="tui-detail-grid">
        <Field label="name"     value={item.name}                                        emphasis="bright" />
        <Field label="category" value={item.category ?? "—"}                              emphasis="warn" />
        <Field label="room"     value={room?.name ?? "—"} />
        <Field label="location" value={location?.name ?? "—"} />
        <Field label="desc"     value={item.description || <Dim>(none)</Dim>} />
        <Field label="updated"  value={relativeTime(item.updatedAtUtc ?? item.createdAtUtc)} />
        <div className="tui-detail-notes">
          <span className="tui-detail-label">notes</span>
          <span className="tui-detail-colon">:</span>{" "}
          {item.notes ? (
            <span>{item.notes}</span>
          ) : (
            <Dim>(none — press [e] to edit)</Dim>
          )}
        </div>
      </div>

      <div className="tui-detail-actions">
        <button type="button" onClick={onEdit} className="tui-detail-action">[e]dit</button>
        <span className="tui-detail-sep">·</span>
        <button type="button" onClick={onDelete} className="tui-detail-action tui-detail-action--danger">[d]elete</button>
      </div>
    </div>
  );
}

function Field({ label, value, emphasis }: {
  label: string;
  value: React.ReactNode;
  emphasis?: "bright" | "warn";
}) {
  return (
    <div className="tui-detail-field">
      <span className="tui-detail-label">{label.padEnd(8, " ")}</span>
      <span className="tui-detail-colon">:</span>{" "}
      <span className={emphasis ? `tui-detail-value tui-detail-value--${emphasis}` : "tui-detail-value"}>
        {value}
      </span>
    </div>
  );
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--c-fg-3)" }}>{children}</span>;
}

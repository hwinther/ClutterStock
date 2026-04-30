import type { ItemResponse, LocationResponse, RoomResponse } from "~/api/client";
import { CategoryTag } from "~/components/category-tag";
import { DrawerField, PanelHeader } from "~/components/panel-ui";
import { nameHue } from "~/lib/colors";
import { relativeTime } from "~/lib/time";

export function ItemViewPanel({ item, room, location, onClose, onEdit, onDelete }: {
  item: ItemResponse;
  room?: RoomResponse | null;
  location?: LocationResponse | null;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const hue = nameHue(item.name ?? "");

  return (
    <aside className="tui-panel" style={{
      width: 340, borderLeft: "1px solid var(--c-border)",
      background: "var(--c-bg-2)", flexShrink: 0,
      display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <span className="tui-panel-title">{`─[ detail · #${item.id} ]─`}</span>
      <PanelHeader
        label={`ITEM #${item.id}`}
        actions={
          <button onClick={onEdit} style={{
            fontSize: 11, color: "var(--c-accent)", cursor: "pointer",
            padding: "2px 8px", borderRadius: 4, border: "1px solid var(--c-border)",
            background: "transparent", fontFamily: "inherit",
          }}>
            Edit
          </button>
        }
        onClose={onClose}
      />

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{
          height: 120, borderRadius: 8,
          background: `linear-gradient(135deg, oklch(0.84 0.05 ${hue}), oklch(0.70 0.06 ${(hue + 40) % 360}))`,
          border: "1px solid var(--c-border)",
        }} />
      </div>

      <div style={{ padding: "14px 16px 6px" }}>
        <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: "-0.01em", color: "var(--c-fg)" }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--c-fg-2)" }}>{item.description}</div>
        )}
      </div>

      <div style={{ padding: "4px 16px" }}>
        <DrawerField label="Category" value={item.category ? <CategoryTag name={item.category} /> : null} />
        <DrawerField label="Room" value={room?.name} />
        <DrawerField label="Location" value={location?.name} />
        <DrawerField label="Updated" value={relativeTime(item.updatedAtUtc ?? item.createdAtUtc)} />
        <DrawerField label="Created" value={relativeTime(item.createdAtUtc)} />
      </div>

      <div style={{ padding: "12px 16px 20px" }}>
        <div style={{
          fontSize: 10, color: "var(--c-fg-3)", textTransform: "uppercase",
          letterSpacing: "0.06em", fontWeight: 600, marginBottom: 6,
        }}>
          Notes
        </div>
        <div style={{
          fontSize: 13, lineHeight: 1.5, padding: 10,
          background: "var(--c-bg-3)", border: "1px solid var(--c-border)",
          borderRadius: 6, minHeight: 48,
          color: item.notes ? "var(--c-fg-2)" : "var(--c-fg-3)",
          fontStyle: item.notes ? "normal" : "italic",
        }}>
          {item.notes || "No notes yet."}
        </div>
      </div>

      <div style={{ padding: "0 16px 20px", marginTop: "auto" }}>
        <button
          onClick={onDelete}
          style={{
            width: "100%", padding: "7px 14px", borderRadius: 6,
            border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.07)",
            color: "#ef4444", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Delete item
        </button>
      </div>
    </aside>
  );
}


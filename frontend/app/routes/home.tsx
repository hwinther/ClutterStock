import { useState, useEffect, useCallback } from "react";
import { useRevalidator } from "react-router";
import type { Route } from "./+types/home";
import { getLocations, getRooms, getItems, createItem, updateItem, deleteItem, createRoom, createLocation } from "~/api/client";
import type { LocationResponse, RoomResponse, ItemResponse } from "~/api/client";
import { useTheme } from "~/lib/theme";

// ── Loader ────────────────────────────────────────────────────────────────────

export async function loader({ request }: Route.LoaderArgs) {
  const [locations, rooms, items] = await Promise.all([
    getLocations(request),
    getRooms(request),
    getItems(request),
  ]);
  return { locations, rooms, items };
}

export function meta() {
  return [{ title: "ClutterStock" }];
}

// ── Types ─────────────────────────────────────────────────────────────────────

type Panel =
  | { mode: "view";         item: ItemResponse }
  | { mode: "edit";         item: ItemResponse }
  | { mode: "new-item";     roomId: number }
  | { mode: "new-room";     locationId?: number }
  | { mode: "new-location" }
  | null;

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso?: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Furniture:   { bg: "rgba(91,91,245,0.10)",  fg: "#5b5bf5" },
  Electronics: { bg: "rgba(34,197,94,0.10)",  fg: "#16a34a" },
  Textiles:    { bg: "rgba(244,114,182,0.10)", fg: "#db2777" },
  Cookware:    { bg: "rgba(249,115,22,0.10)",  fg: "#ea580c" },
  Appliances:  { bg: "rgba(239,68,68,0.10)",   fg: "#dc2626" },
  Lighting:    { bg: "rgba(234,179,8,0.10)",   fg: "#ca8a04" },
  Decor:       { bg: "rgba(168,85,247,0.10)",  fg: "#9333ea" },
  Plants:      { bg: "rgba(34,197,94,0.10)",   fg: "#16a34a" },
  Tableware:   { bg: "rgba(20,184,166,0.10)",  fg: "#0d9488" },
  Sports:      { bg: "rgba(14,165,233,0.10)",  fg: "#0284c7" },
  Media:       { bg: "rgba(168,85,247,0.10)",  fg: "#9333ea" },
  Seasonal:    { bg: "rgba(234,179,8,0.10)",   fg: "#ca8a04" },
  Travel:      { bg: "rgba(14,165,233,0.10)",  fg: "#0284c7" },
};

// ── Atoms ─────────────────────────────────────────────────────────────────────

function ItemThumb({ name }: { name: string }) {
  const theme = useTheme();
  const hue = nameHue(name);
  if (theme === "tui") {
    return (
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        border: "1px dashed var(--c-fg-3)",
        display: "grid", placeItems: "center",
        color: "var(--c-fg-3)", fontSize: 10,
      }}>##</div>
    );
  }
  if (theme === "win98") {
    return (
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        display: "grid", placeItems: "center",
        fontSize: 16, lineHeight: 1,
      }}>📄</div>
    );
  }
  if (theme === "cde") {
    return (
      <div style={{
        width: 24, height: 24, flexShrink: 0,
        background: "#dcdad5",
        boxShadow: "inset -1px -1px 0 #cbd1dc, inset 1px 1px 0 #5b6878",
        display: "grid", placeItems: "center",
        fontSize: 13, lineHeight: 1,
      }}>▣</div>
    );
  }
  return (
    <div style={{
      width: 28, height: 28, borderRadius: 6, flexShrink: 0,
      background: `linear-gradient(135deg, oklch(0.85 0.05 ${hue}), oklch(0.70 0.07 ${(hue + 40) % 360}))`,
      border: "1px solid var(--c-border)",
    }} />
  );
}

function CategoryTag({ name }: { name: string }) {
  const theme = useTheme();
  if (theme === "tui") {
    return (
      <span style={{
        fontSize: 11, padding: "1px 6px",
        border: "1px solid #ffd24d", color: "#ffd24d",
        fontFamily: "inherit", whiteSpace: "nowrap",
      }}>[{name}]</span>
    );
  }
  if (theme === "win98") {
    return <span style={{ fontSize: 11, color: "var(--c-fg)" }}>{name}</span>;
  }
  if (theme === "cde") {
    return <span style={{ fontSize: 11, color: "#3d6062", fontWeight: 700 }}>{name}</span>;
  }
  const c = CATEGORY_COLORS[name] ?? { bg: "rgba(120,120,140,0.10)", fg: "var(--c-fg-2)" };
  return (
    <span style={{
      fontSize: 11, padding: "2px 8px", borderRadius: 4,
      background: c.bg, color: c.fg, fontWeight: 500, whiteSpace: "nowrap",
    }}>
      {name}
    </span>
  );
}

// ── TUI structural helpers ────────────────────────────────────────────────────

function TuiPanel({ title, as: Tag = "div", children, style }: {
  title: string;
  as?: "div" | "aside";
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <Tag className="tui-panel" style={style}>
      <span className="tui-panel-title">{title}</span>
      {children}
    </Tag>
  );
}

function TuiStatusBar() {
  const bindings: [string, string][] = [
    ["↑↓ / j k", "move"], ["e", "edit"], ["d", "del"],
    ["n", "new"], ["/", "filter"], ["Esc", "close"],
  ];
  return (
    <div className="tui-statusbar">
      {bindings.map(([k, l]) => (
        <span key={k}>
          <span className="tui-statusbar-key">{k}</span>{" "}{l}
        </span>
      ))}
      <span className="tui-statusbar-prompt">
        $ _<span className="tui-cursor">▌</span>
      </span>
    </div>
  );
}

function Sparkline({ seed }: { seed: number }) {
  const w = 56, h = 20, n = 7;
  const pts = Array.from({ length: n }, (_, i) => i).reduce<number[]>((acc, i) => {
    const prev = acc.length > 0 ? acc[acc.length - 1]! : Math.max(1, seed * 0.5);
    const noise = ((seed * (i * 13 + 7)) % 7) - 3;
    const next = Math.max(1, prev + (seed - prev) * 0.35 + noise);
    acc.push(i === n - 1 ? seed : Math.round(next));
    return acc;
  }, []);
  const max = Math.max(...pts, 1);
  const coords = pts
    .map((p, i) => `${((i / (n - 1)) * w).toFixed(1)},${(h - (p / max) * h).toFixed(1)}`)
    .join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0, overflow: "visible" }}>
      <polyline fill="none" stroke="var(--c-accent)" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round" points={coords} opacity="0.8" />
    </svg>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function SidebarGroup({ title, onAdd, children }: { title: string; onAdd?: () => void; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        padding: "0 14px 6px", fontSize: 10, fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--c-fg-3)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span className="sidebar-group-title">{title}</span>
        {onAdd && (
          <button onClick={onAdd} title="New room" style={{
            border: "none", background: "transparent", color: "var(--c-fg-3)",
            fontSize: 14, lineHeight: 1, cursor: "pointer", padding: "0 2px",
            fontFamily: "inherit", borderRadius: 3,
          }}>＋</button>
        )}
      </div>
      {children}
    </div>
  );
}

function SidebarRow({ label, count, active, dot, onClick }: {
  label: string; count: number; active: boolean; dot?: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={active ? "sidebar-row-active" : undefined}
      style={{
        width: "100%", textAlign: "left", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "5px 14px", fontSize: 13,
        color: active ? "var(--c-fg)" : "var(--c-fg-2)",
        background: active ? "var(--c-accent-bg)" : "transparent",
        borderLeft: `2px solid ${active ? "var(--c-accent)" : "transparent"}`,
        fontFamily: "inherit",
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {dot && (
          <span style={{
            width: 6, height: 6, borderRadius: 2,
            background: "var(--c-accent)", opacity: 0.6, flexShrink: 0,
          }} />
        )}
        {label}
      </span>
      <span style={{ fontSize: 11, color: "var(--c-fg-3)", fontVariantNumeric: "tabular-nums" }}>
        {count}
      </span>
    </button>
  );
}

// ── Panel header ──────────────────────────────────────────────────────────────

function PanelHeader({ label, actions, onClose }: {
  label: React.ReactNode;
  actions?: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div style={{
      padding: "10px 16px", borderBottom: "1px solid var(--c-border)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: "var(--c-fg-3)", fontFamily: "ui-monospace, monospace" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {actions}
        <button onClick={onClose} style={{
          border: "none", background: "transparent", color: "var(--c-fg-3)",
          fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 4px",
          borderRadius: 4, fontFamily: "inherit",
        }}>×</button>
      </div>
    </div>
  );
}

// ── View drawer ───────────────────────────────────────────────────────────────

function DrawerField({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "6px 0", borderBottom: "1px solid var(--c-border-2)", fontSize: 13,
    }}>
      <span style={{ color: "var(--c-fg-3)" }}>{label}</span>
      <span style={{ color: "var(--c-fg)", fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ViewPanel({ item, room, location, onClose, onEdit, onDelete }: {
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

// ── Edit / New form panel ─────────────────────────────────────────────────────

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <label style={{ fontSize: 11, fontWeight: 500, color: "var(--c-fg-2)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: 6, boxSizing: "border-box",
  border: "1px solid var(--c-border)", background: "var(--c-bg-3)",
  color: "var(--c-fg)", fontSize: 13, fontFamily: "inherit",
  outline: "none",
};

function EditPanel({ item, rooms, locations, defaultRoomId, onClose, onSaved, onDeleted, onNewRoom }: {
  item?: ItemResponse;
  rooms: RoomResponse[];
  locations: LocationResponse[];
  defaultRoomId?: number;
  onClose: () => void;
  onSaved: (saved: ItemResponse) => void;
  onDeleted: () => void;
  onNewRoom?: (locationId?: number) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNew = !item;
  const locationById = Object.fromEntries(locations.map(l => [l.id!, l]));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string ?? "").trim();
    if (!name) { setError("Name is required."); return; }
    const body = {
      roomId: isNew ? Number(fd.get("roomId")) : item.roomId!,
      name,
      description: (fd.get("description") as string ?? "").trim() || undefined,
      category:    (fd.get("category")    as string ?? "").trim() || undefined,
      notes:       (fd.get("notes")       as string ?? "").trim() || undefined,
    };
    setSubmitting(true);
    setError(null);
    try {
      const saved = isNew
        ? await createItem(body)
        : await updateItem(item.id!, body);
      onSaved(saved);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!item?.id || !confirm("Delete this item?")) return;
    setSubmitting(true);
    try {
      await deleteItem(item.id);
      onDeleted();
    } catch {
      setError("Failed to delete item.");
      setSubmitting(false);
    }
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
          <FormField label="Room">
            <div style={{ ...inputStyle, color: "var(--c-fg-2)", cursor: "default" }}>
              {(() => {
                const room = rooms.find(r => r.id === item.roomId);
                const loc = room?.locationId != null ? locationById[room.locationId] : null;
                return loc ? `${loc.name} / ${room?.name}` : (room?.name ?? "—");
              })()}
            </div>
          </FormField>
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

// ── Location form panel ───────────────────────────────────────────────────────

function LocationFormPanel({ onClose, onCreated }: {
  onClose: () => void;
  onCreated: (loc: LocationResponse) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string ?? "").trim();
    if (!name) { setError("Name is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const loc = await createLocation({
        name,
        description: (fd.get("description") as string ?? "").trim() || undefined,
      });
      onCreated(loc);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
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

// ── Room form panel ───────────────────────────────────────────────────────────

function RoomFormPanel({ locations, defaultLocationId, onClose, onCreated }: {
  locations: LocationResponse[];
  defaultLocationId?: number;
  onClose: () => void;
  onCreated: (room: RoomResponse) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = (fd.get("name") as string ?? "").trim();
    const locationId = Number(fd.get("locationId"));
    if (!name) { setError("Name is required."); return; }
    if (!locationId) { setError("Select a location."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const room = await createRoom({
        locationId,
        name,
        description: (fd.get("description") as string ?? "").trim() || undefined,
      });
      onCreated(room);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <aside className="tui-panel" style={{
      width: 340, borderLeft: "1px solid var(--c-border)",
      background: "var(--c-bg-2)", flexShrink: 0,
      display: "flex", flexDirection: "column", overflowY: "auto",
    }}>
      <span className="tui-panel-title">─[ new room ]─</span>
      <PanelHeader label="NEW ROOM" onClose={onClose} />
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16 }}>
        {error && <div style={{ fontSize: 12, color: "#ef4444", padding: "6px 10px", background: "rgba(239,68,68,0.08)", borderRadius: 6 }}>{error}</div>}
        <FormField label="Location">
          <select name="locationId" defaultValue={defaultLocationId ?? locations[0]?.id ?? ""} style={inputStyle}>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Name *">
          <input name="name" type="text" required autoFocus placeholder="e.g. Garage, Living Room" style={inputStyle} />
        </FormField>
        <FormField label="Description">
          <textarea name="description" rows={2} placeholder="e.g. North-facing bedroom" style={{ ...inputStyle, resize: "vertical" }} />
        </FormField>
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" disabled={submitting} style={{
            flex: 1, padding: "8px 14px", borderRadius: 6, border: "none",
            background: "var(--c-accent)", color: "#fff", fontSize: 13, fontWeight: 500,
            cursor: submitting ? "not-allowed" : "pointer", opacity: submitting ? 0.7 : 1, fontFamily: "inherit",
          }}>
            {submitting ? "Creating…" : "Create room"}
          </button>
          <button type="button" onClick={onClose} disabled={submitting} style={{
            padding: "8px 14px", borderRadius: 6, border: "1px solid var(--c-border)",
            background: "transparent", color: "var(--c-fg-2)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
          }}>Cancel</button>
        </div>
        <p style={{ fontSize: 11, color: "var(--c-fg-3)", margin: 0 }}>
          After creating the room you&apos;ll be able to add items to it.
        </p>
      </form>
    </aside>
  );
}

// ── CDE chrome components ─────────────────────────────────────────────────────

function CDEMenuBar() {
  const menus = ["File", "Selected", "View", "Items", "Help"];
  return (
    <div className="cde-menubar">
      {menus.map(m => (
        <span key={m} className="cde-menubar-item">{m}</span>
      ))}
    </div>
  );
}

function CDEFootRow({ onNewItem }: { onNewItem: () => void }) {
  const slots: [string, (() => void) | null][] = [
    ["Items", null], ["Rooms", null], ["Stats", null],
    ["Add",   onNewItem],
    ["Print", null], ["Trash", null], ["Help", null],
  ];
  return (
    <div className="cde-footrow">
      {slots.map(([label, action], i) => (
        <button
          key={label}
          className={`cde-footrow-btn${i === 0 ? " cde-footrow-btn--primary" : ""}`}
          onClick={action ?? undefined}
          type="button"
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Win98 chrome components ───────────────────────────────────────────────────

function Win98MenuBar() {
  const menus = ["File", "Edit", "View", "Items", "Tools", "Help"];
  return (
    <div className="win98-menubar">
      {menus.map(m => (
        <span key={m} className="win98-menubar-item">
          <u>{m[0]}</u>{m.slice(1)}
        </span>
      ))}
    </div>
  );
}

function Win98AddressBar({ location, room }: {
  location?: LocationResponse | null;
  room?: RoomResponse | null;
}) {
  const path = room && location
    ? `C:\\ClutterStock\\${location.name}\\${room.name}`
    : location
    ? `C:\\ClutterStock\\${location.name}`
    : `C:\\ClutterStock\\All Items`;
  return (
    <div className="win98-addressbar">
      <span className="win98-addressbar-label">Address</span>
      <div className="win98-addressbar-field">
        <span>📁</span>
        <span>{path}</span>
      </div>
      <button className="win98-addressbar-go">Go</button>
    </div>
  );
}

function Win98StatusBar({ count, location, room }: {
  count: number;
  location?: LocationResponse | null;
  room?: RoomResponse | null;
}) {
  const path = room && location
    ? `${location.name}\\${room.name}`
    : location?.name ?? "All Items";
  return (
    <div className="win98-statusbar">
      <div className="win98-statusbar-seg">{count} object(s)</div>
      <div className="win98-statusbar-seg">{path}</div>
      <div className="win98-statusbar-seg win98-statusbar-seg--narrow">
        {new Date().toLocaleDateString()}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Home({ loaderData }: Route.ComponentProps) {
  const { locations, rooms, items } = loaderData;
  const { revalidate } = useRevalidator();

  const [panel, setPanel]                   = useState<Panel>(null);
  const [filterRoomId, setFilterRoomId]     = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const roomById     = Object.fromEntries(rooms.map(r => [r.id!, r]));
  const locationById = Object.fromEntries(locations.map(l => [l.id!, l]));

  const categories = [...new Set(
    items.map(i => i.category).filter((c): c is string => !!c)
  )].sort();

  const visibleItems = items.filter(item => {
    if (filterRoomId !== null && item.roomId !== filterRoomId) return false;
    if (filterCategory !== null && item.category !== filterCategory) return false;
    return true;
  });

  const activeRoom     = filterRoomId != null ? roomById[filterRoomId] : null;
  const activeLocation = activeRoom?.locationId != null ? locationById[activeRoom.locationId] : null;

  const defaultNewRoomId = filterRoomId ?? rooms[0]?.id ?? undefined;

  const viewItem     = panel?.mode === "view" ? panel.item : null;
  const viewRoom     = viewItem?.roomId != null ? roomById[viewItem.roomId] : null;
  const viewLocation = viewRoom?.locationId != null ? locationById[viewRoom.locationId] : null;

  const openNewItem = useCallback(() => {
    if (rooms.length === 0) {
      setPanel(locations.length === 0 ? { mode: "new-location" } : { mode: "new-room" });
    } else {
      setPanel({ mode: "new-item", roomId: defaultNewRoomId ?? rooms[0]!.id! });
    }
  }, [rooms, locations, defaultNewRoomId]);

  function handleItemSaved(saved: ItemResponse) {
    revalidate();
    setPanel({ mode: "view", item: saved });
  }

  function handleItemDeleted() {
    revalidate();
    setPanel(null);
  }

  function handleLocationCreated(loc: LocationResponse) {
    revalidate();
    setPanel({ mode: "new-room", locationId: loc.id });
  }

  function handleRoomCreated(room: RoomResponse) {
    revalidate();
    setPanel({ mode: "new-item", roomId: room.id! });
  }

  const stats = [
    { label: "Total items", value: items.length },
    { label: "Locations",   value: locations.length },
    { label: "Rooms",       value: rooms.length },
    { label: "Categories",  value: categories.length },
  ];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const selectedIdx = panel?.mode === "view"
        ? visibleItems.findIndex(i => i.id === panel.item.id)
        : -1;

      switch (e.key) {
        case "ArrowUp":
        case "k": {
          e.preventDefault();
          if (visibleItems.length === 0) break;
          const prev = visibleItems[selectedIdx <= 0 ? visibleItems.length - 1 : selectedIdx - 1];
          if (prev) setPanel({ mode: "view", item: prev });
          break;
        }
        case "ArrowDown":
        case "j": {
          e.preventDefault();
          if (visibleItems.length === 0) break;
          const next = visibleItems[selectedIdx >= visibleItems.length - 1 ? 0 : selectedIdx + 1];
          if (next) setPanel({ mode: "view", item: next });
          break;
        }
        case "e": {
          if (panel?.mode === "view") setPanel({ mode: "edit", item: panel.item });
          break;
        }
        case "d": {
          if (panel?.mode === "view") {
            const item = panel.item;
            if (confirm(`Delete "${item.name}"?`)) {
              deleteItem(item.id!).then(() => { revalidate(); setPanel(null); });
            }
          }
          break;
        }
        case "n": {
          openNewItem();
          break;
        }
        case "Escape": {
          setPanel(null);
          break;
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, visibleItems, openNewItem, revalidate]);

  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      overflow: "hidden", minHeight: 0, background: "var(--c-bg)",
    }}>

      <Win98MenuBar />
      <CDEMenuBar />

      {/* Stats row */}
      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`,
        gap: 1, background: "var(--c-border-2)",
        borderBottom: "1px solid var(--c-border)", flexShrink: 0,
      }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "12px 20px", background: "var(--c-bg-2)",
            display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 10,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{
                fontSize: 11, color: "var(--c-fg-2)",
                textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 500,
              }}>
                {s.label}
              </span>
              <span style={{
                fontSize: 26, fontWeight: 600,
                fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em", color: "var(--c-fg)",
              }}>
                {s.value}
              </span>
            </div>
            <Sparkline seed={s.value} />
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 20px", borderBottom: "1px solid var(--c-border)",
        background: "var(--c-bg-2)", flexShrink: 0, gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          {activeRoom && (
            <span style={{
              fontSize: 12, padding: "4px 10px",
              border: "1px solid var(--c-border)", background: "var(--c-accent-bg)",
              color: "var(--c-accent)", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ opacity: 0.7 }}>Room</span>
              <span style={{ fontWeight: 500 }}>
                {activeLocation && `${activeLocation.name} / `}{activeRoom.name}
              </span>
              <button
                onClick={() => setFilterRoomId(null)}
                style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
              >×</button>
            </span>
          )}
          {filterCategory && (
            <span style={{
              fontSize: 12, padding: "4px 10px",
              border: "1px solid var(--c-border)", background: "var(--c-accent-bg)",
              color: "var(--c-accent)", borderRadius: 6,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ opacity: 0.7 }}>Category</span>
              <span style={{ fontWeight: 500 }}>{filterCategory}</span>
              <button
                onClick={() => setFilterCategory(null)}
                style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", padding: 0, lineHeight: 1, fontSize: 14 }}
              >×</button>
            </span>
          )}
          {!activeRoom && !filterCategory && (
            <span style={{ fontSize: 12, color: "var(--c-fg-3)" }}>All items</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: "var(--c-fg-2)", fontVariantNumeric: "tabular-nums" }}>
            <span style={{ color: "var(--c-fg-3)" }}>Showing </span>
            <strong style={{ fontWeight: 500, color: "var(--c-fg)" }}>{visibleItems.length}</strong>
            {visibleItems.length !== items.length && (
              <span style={{ color: "var(--c-fg-3)" }}> of {items.length}</span>
            )}
          </span>
          <button onClick={openNewItem} className="btn-primary">+ New item</button>
        </div>
      </div>

      <Win98AddressBar location={activeLocation} room={activeRoom} />

      {/* 3-column body */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>

        {/* Sidebar */}
        <TuiPanel as="aside" title="─[ nav ]─" style={{
          width: 200, borderRight: "1px solid var(--c-border)",
          background: "var(--c-bg-2)", padding: "14px 0",
          flexShrink: 0, overflowY: "auto",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ flex: 1 }}>
            {locations.map(loc => {
              const locRooms = rooms.filter(r => r.locationId === loc.id);
              return (
                <SidebarGroup
                  key={loc.id}
                  title={loc.name ?? "Location"}
                  onAdd={() => setPanel({ mode: "new-room", locationId: loc.id })}
                >
                  {locRooms.map(room => (
                    <SidebarRow
                      key={room.id}
                      label={room.name ?? "Room"}
                      count={items.filter(i => i.roomId === room.id).length}
                      active={filterRoomId === room.id}
                      onClick={() => {
                        setFilterRoomId(filterRoomId === room.id ? null : room.id!);
                        setFilterCategory(null);
                      }}
                    />
                  ))}
                  {locRooms.length === 0 && (
                    <div style={{ padding: "3px 14px 6px", fontSize: 12, color: "var(--c-fg-3)", fontStyle: "italic" }}>
                      No rooms yet
                    </div>
                  )}
                </SidebarGroup>
              );
            })}

            {categories.length > 0 && (
              <SidebarGroup title="Categories">
                {categories.map(cat => (
                  <SidebarRow
                    key={cat}
                    label={cat}
                    count={items.filter(i => i.category === cat).length}
                    active={filterCategory === cat}
                    dot
                    onClick={() => {
                      setFilterCategory(filterCategory === cat ? null : cat);
                      setFilterRoomId(null);
                    }}
                  />
                ))}
              </SidebarGroup>
            )}
          </div>

          {/* New location button at sidebar bottom */}
          <div style={{ borderTop: "1px solid var(--c-border)", padding: "10px 14px" }}>
            <button
              onClick={() => setPanel({ mode: "new-location" })}
              style={{
                width: "100%", textAlign: "left", border: "none", cursor: "pointer",
                background: "transparent", fontFamily: "inherit",
                fontSize: 12, color: "var(--c-fg-3)", padding: "3px 0",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              <span style={{ fontSize: 14, lineHeight: 1 }}>＋</span>
              New location
            </button>
          </div>
        </TuiPanel>

        {/* Table */}
        <TuiPanel title={`─[ items · ${visibleItems.length}${visibleItems.length !== items.length ? ` of ${items.length}` : ""} ]─`} style={{ flex: 1, minWidth: 0, overflowY: "auto", background: "var(--c-bg)" }}>
          {visibleItems.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "100%", gap: 8,
              color: "var(--c-fg-3)", fontSize: 13,
            }}>
              <span>No items{filterRoomId || filterCategory ? " matching filters" : ""}.</span>
              <button
                onClick={openNewItem}
                className="link-text"
                style={{ border: "none", background: "transparent", cursor: "pointer", fontFamily: "inherit", fontSize: 13 }}
              >
                {rooms.length === 0 ? "Set up a location to get started →" : "Add the first item →"}
              </button>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "var(--c-bg-2)", position: "sticky", top: 0, zIndex: 1 }}>
                  {["Item", "Room", "Category", "Notes", "Updated"].map((h, i) => (
                    <th key={i} style={{
                      textAlign: "left", padding: "8px 14px",
                      fontSize: 11, fontWeight: 500, color: "var(--c-fg-2)",
                      textTransform: "uppercase", letterSpacing: "0.04em",
                      borderBottom: "1px solid var(--c-border)",
                    }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleItems.map(item => {
                  const isSelected = panel?.mode === "view" && panel.item.id === item.id;
                  const room = item.roomId != null ? roomById[item.roomId] : null;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setPanel(isSelected ? null : { mode: "view", item })}
                      data-selected={isSelected ? "true" : undefined}
                      style={{
                        borderBottom: "1px solid var(--c-border-2)",
                        background: isSelected ? "var(--c-accent-bg-2)" : "transparent",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "var(--c-accent-bg)";
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <td style={{
                        padding: "10px 14px",
                        borderLeft: `2px solid ${isSelected ? "var(--c-accent)" : "transparent"}`,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <ItemThumb name={item.name ?? ""} />
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <span style={{ fontWeight: 500 }}>{item.name ?? "Unnamed"}</span>
                            {item.description && (
                              <span style={{ fontSize: 11, color: "var(--c-fg-3)" }}>{item.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-2)" }}>
                        {room?.name ?? "—"}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {item.category
                          ? <CategoryTag name={item.category} />
                          : <span style={{ color: "var(--c-fg-3)" }}>—</span>}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-3)", fontSize: 12 }}>
                        {item.notes || "—"}
                      </td>
                      <td style={{ padding: "10px 14px", color: "var(--c-fg-2)", fontSize: 12, fontVariantNumeric: "tabular-nums" }}>
                        {relativeTime(item.updatedAtUtc ?? item.createdAtUtc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TuiPanel>

        {/* Right panel */}
        {panel?.mode === "view" && (
          <ViewPanel
            item={panel.item}
            room={viewRoom}
            location={viewLocation}
            onClose={() => setPanel(null)}
            onEdit={() => setPanel({ mode: "edit", item: panel.item })}
            onDelete={() => {
              deleteItem(panel.item.id!).then(() => {
                revalidate();
                setPanel(null);
              });
            }}
          />
        )}
        {(panel?.mode === "edit" || panel?.mode === "new-item") && (
          <EditPanel
            item={panel.mode === "edit" ? panel.item : undefined}
            rooms={rooms}
            locations={locations}
            defaultRoomId={panel.mode === "new-item" ? panel.roomId : undefined}
            onClose={() => setPanel(null)}
            onSaved={handleItemSaved}
            onDeleted={handleItemDeleted}
            onNewRoom={(locationId) => setPanel({ mode: "new-room", locationId })}
          />
        )}
        {panel?.mode === "new-room" && (
          <RoomFormPanel
            locations={locations}
            defaultLocationId={panel.locationId}
            onClose={() => setPanel(null)}
            onCreated={handleRoomCreated}
          />
        )}
        {panel?.mode === "new-location" && (
          <LocationFormPanel
            onClose={() => setPanel(null)}
            onCreated={handleLocationCreated}
          />
        )}
      </div>
      <TuiStatusBar />
      <Win98StatusBar count={visibleItems.length} location={activeLocation} room={activeRoom} />
      <CDEFootRow onNewItem={openNewItem} />
    </div>
  );
}

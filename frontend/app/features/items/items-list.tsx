import { Form, Link } from "react-router";
import { routes } from "~/constants/routes";
import type { ItemResponse } from "~/api/client";

type ItemsListProps = {
  locationId: number;
  roomId: number;
  roomName: string;
  items: ItemResponse[];
};

const CATEGORY_COLORS: Record<string, { bg: string; fg: string }> = {
  Furniture:    { bg: "rgba(91,91,245,0.10)",   fg: "#5b5bf5" },
  Electronics:  { bg: "rgba(34,197,94,0.10)",   fg: "#16a34a" },
  Textiles:     { bg: "rgba(244,114,182,0.10)",  fg: "#db2777" },
  Cookware:     { bg: "rgba(249,115,22,0.10)",   fg: "#ea580c" },
  Appliances:   { bg: "rgba(239,68,68,0.10)",    fg: "#dc2626" },
  Lighting:     { bg: "rgba(234,179,8,0.10)",    fg: "#ca8a04" },
  Decor:        { bg: "rgba(168,85,247,0.10)",   fg: "#9333ea" },
  Plants:       { bg: "rgba(34,197,94,0.10)",    fg: "#16a34a" },
  Tableware:    { bg: "rgba(20,184,166,0.10)",   fg: "#0d9488" },
  Sports:       { bg: "rgba(14,165,233,0.10)",   fg: "#0284c7" },
  Media:        { bg: "rgba(168,85,247,0.10)",   fg: "#9333ea" },
  Seasonal:     { bg: "rgba(234,179,8,0.10)",    fg: "#ca8a04" },
  Travel:       { bg: "rgba(14,165,233,0.10)",   fg: "#0284c7" },
};

function nameHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = ((h * 31) + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

function ItemThumb({ name }: { name: string }) {
  const hue = nameHue(name);
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: 6,
      background: `linear-gradient(135deg, oklch(0.85 0.05 ${hue}), oklch(0.70 0.07 ${(hue + 40) % 360}))`,
      border: "1px solid var(--c-border)",
      flexShrink: 0,
    }} />
  );
}

function CategoryTag({ name }: { name: string }) {
  const c = CATEGORY_COLORS[name] ?? { bg: "rgba(120,120,140,0.10)", fg: "var(--c-fg-2)" };
  return (
    <span style={{
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 4,
      background: c.bg,
      color: c.fg,
      fontWeight: 500,
      whiteSpace: "nowrap",
    }}>
      {name}
    </span>
  );
}

export function ItemsList({ locationId, roomId, roomName, items }: ItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">No items in {roomName} yet.</p>
        <Link to={routes.locations.roomItemsNew(locationId, roomId)} className="link-text" style={{ display: "inline-block", marginTop: 12 }}>
          Add the first item →
        </Link>
      </div>
    );
  }

  return (
    <table className="console-table">
      <thead>
        <tr>
          <th>Item</th>
          <th>Category</th>
          <th>Notes</th>
          <th style={{ width: 1, whiteSpace: "nowrap" }}></th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <td>
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
            <td>
              {item.category ? <CategoryTag name={item.category} /> : <span style={{ color: "var(--c-fg-3)" }}>—</span>}
            </td>
            <td style={{ color: "var(--c-fg-3)", fontSize: 12 }}>
              {item.notes || "—"}
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link to={routes.locations.itemEdit(locationId, roomId, item.id!)} className="link-chip">
                  Edit
                </Link>
                <Form
                  method="post"
                  onSubmit={(e) => {
                    if (!confirm("Delete this item?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="id" value={item.id} />
                  <button type="submit" className="link-chip" style={{ color: "var(--c-danger)", borderColor: "transparent" }}>
                    Delete
                  </button>
                </Form>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

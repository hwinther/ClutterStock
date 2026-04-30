import { Form, Link } from "react-router";
import { routes } from "~/constants/routes";
import type { ItemResponse } from "~/api/client";
import { ItemThumb } from "~/components/item-thumb";
import { CategoryTag } from "~/components/category-tag";

type ItemsListProps = {
  locationId: number;
  roomId: number;
  roomName: string;
  items: ItemResponse[];
};

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

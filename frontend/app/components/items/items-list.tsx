import { Form, Link } from "react-router";
import type { ItemResponse } from "~/api/client";

type ItemsListProps = {
  locationId: number;
  roomId: number;
  roomName: string;
  items: ItemResponse[];
};

export function ItemsList({
  locationId,
  roomId,
  roomName,
  items,
}: ItemsListProps) {
  const base = `/locations/${locationId}/rooms/${roomId}/items`;

  if (items.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">
          No items in {roomName} yet. Add the first item.
        </p>
        <Link to={`${base}/new`} className="link-text mt-4 inline-block">
          Add item
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item.id} className="card-row">
          <div>
            <p className="text-body">{item.name ?? "Unnamed"}</p>
            {(item.description || item.category) && (
              <p className="text-muted-sm">
                {[item.description, item.category].filter(Boolean).join(" · ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link to={`${base}/${item.id}/edit`} className="link-chip">
              Edit
            </Link>
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("Delete this item?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="_action" value="delete" />
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="link-chip text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                Delete
              </button>
            </Form>
          </div>
        </li>
      ))}
    </ul>
  );
}

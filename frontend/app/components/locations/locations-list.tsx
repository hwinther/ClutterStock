import { Form, Link } from "react-router";
import type { LocationResponse } from "~/api/client";

export function LocationsList({ locations }: { locations: LocationResponse[] }) {
  if (locations.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">
          No locations yet. Add your first location to get started.
        </p>
        <Link to="/locations/new" className="link-text mt-4 inline-block">
          Add location
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {locations.map((loc) => (
        <li key={loc.id} className="card-row">
          <div>
            <p className="text-body">{loc.name ?? "Unnamed"}</p>
            {loc.description && (
              <p className="text-muted-sm">{loc.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/locations/${loc.id}/rooms`}
              className="link-chip"
            >
              Rooms
            </Link>
            <Link to={`/locations/${loc.id}/edit`} className="link-chip">
              Edit
            </Link>
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("Delete this location and all its rooms and items?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="_action" value="delete" />
              <input type="hidden" name="id" value={loc.id} />
              <button type="submit" className="link-chip text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
                Delete
              </button>
            </Form>
          </div>
        </li>
      ))}
    </ul>
  );
}

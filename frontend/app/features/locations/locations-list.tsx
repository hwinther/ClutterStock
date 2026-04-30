import { Form, Link } from "react-router";
import { routes } from "~/constants/routes";
import type { LocationResponse } from "~/api/client";

export function LocationsList({ locations }: { locations: LocationResponse[] }) {
  if (locations.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">No locations yet.</p>
        <Link to={routes.locations.new()} className="link-text" style={{ display: "inline-block", marginTop: 12 }}>
          Add your first location →
        </Link>
      </div>
    );
  }

  return (
    <table className="console-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th style={{ width: 1, whiteSpace: "nowrap" }}></th>
        </tr>
      </thead>
      <tbody>
        {locations.map((loc) => (
          <tr key={loc.id}>
            <td>
              <span style={{ fontWeight: 500 }}>{loc.name ?? "Unnamed"}</span>
            </td>
            <td style={{ color: "var(--c-fg-3)", fontSize: 12 }}>
              {loc.description || "—"}
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link to={routes.locations.rooms(loc.id!)} className="link-chip">
                  Rooms
                </Link>
                <Link to={routes.locations.edit(loc.id!)} className="link-chip">
                  Edit
                </Link>
                <Form
                  method="post"
                  onSubmit={(e) => {
                    if (!confirm("Delete this location and all its rooms and items?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="id" value={loc.id} />
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

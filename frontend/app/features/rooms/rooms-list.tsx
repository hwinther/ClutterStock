import { Form, Link } from "react-router";
import { routes } from "~/constants/routes";
import type { RoomResponse } from "~/api/client";

type RoomsListProps = {
  locationId: number;
  locationName: string;
  rooms: RoomResponse[];
};

export function RoomsList({ locationId, locationName, rooms }: RoomsListProps) {
  if (rooms.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">No rooms in {locationName} yet.</p>
        <Link to={routes.locations.roomsNew(locationId)} className="link-text" style={{ display: "inline-block", marginTop: 12 }}>
          Add the first room →
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
        {rooms.map((room) => (
          <tr key={room.id}>
            <td>
              <span style={{ fontWeight: 500 }}>{room.name ?? "Unnamed"}</span>
            </td>
            <td style={{ color: "var(--c-fg-3)", fontSize: 12 }}>
              {room.description || "—"}
            </td>
            <td>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Link to={routes.locations.roomItems(locationId, room.id!)} className="link-chip">
                  Items
                </Link>
                <Link to={routes.locations.roomEdit(locationId, room.id!)} className="link-chip">
                  Edit
                </Link>
                <Form
                  method="post"
                  onSubmit={(e) => {
                    if (!confirm("Delete this room and all its items?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="_action" value="delete" />
                  <input type="hidden" name="id" value={room.id} />
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

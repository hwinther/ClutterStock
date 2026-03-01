import { Form, Link } from "react-router";
import type { RoomResponse } from "~/api/client";

type RoomsListProps = {
  locationId: number;
  locationName: string;
  rooms: RoomResponse[];
};

export function RoomsList({ locationId, locationName, rooms }: RoomsListProps) {
  const base = `/locations/${locationId}/rooms`;

  if (rooms.length === 0) {
    return (
      <div className="card-empty">
        <p className="text-muted">
          No rooms in {locationName} yet. Add the first room.
        </p>
        <Link to={`${base}/new`} className="link-text mt-4 inline-block">
          Add room
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {rooms.map((room) => (
        <li key={room.id} className="card-row">
          <div>
            <p className="text-body">{room.name ?? "Unnamed"}</p>
            {room.description && (
              <p className="text-muted-sm">{room.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              to={`/locations/${locationId}/rooms/${room.id}/items`}
              className="link-chip"
            >
              Items
            </Link>
            <Link to={`${base}/${room.id}/edit`} className="link-chip">
              Edit
            </Link>
            <Form
              method="post"
              onSubmit={(e) => {
                if (!confirm("Delete this room and all its items?")) {
                  e.preventDefault();
                }
              }}
            >
              <input type="hidden" name="_action" value="delete" />
              <input type="hidden" name="id" value={room.id} />
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

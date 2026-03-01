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
        <p className="text-muted">
          No rooms in {locationName} yet. Add the first room.
        </p>
        <Link
          to={routes.locations.roomsNew(locationId)}
          className="link-text mt-4 inline-block"
        >
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
              to={routes.locations.roomItems(locationId, room.id!)}
              className="link-chip"
            >
              Items
            </Link>
            <Link
              to={routes.locations.roomEdit(locationId, room.id!)}
              className="link-chip"
            >
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

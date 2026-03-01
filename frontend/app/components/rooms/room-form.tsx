import { Form, Link } from "react-router";
import type { RoomResponse } from "~/api/client";

type RoomFormProps = {
  title: string;
  submitLabel: string;
  error?: string;
  room?: RoomResponse | null;
  locationId: number;
  cancelTo: string;
};

export function RoomForm({
  title,
  submitLabel,
  error,
  room,
  locationId,
  cancelTo,
}: RoomFormProps) {
  if (room === null) {
    return (
      <div className="card-padded">
        <p className="text-muted">Room not found.</p>
        <Link to={cancelTo} className="link-text mt-2 inline-block">
          Back to rooms
        </Link>
      </div>
    );
  }

  return (
    <div className="card-padded">
      <h2 className="card-title">{title}</h2>
      <Form method="post" className="form-group">
        {error && <p className="text-error">{error}</p>}
        <div className="form-field">
          <label htmlFor="name" className="form-label">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            autoFocus={!room}
            defaultValue={room?.name ?? ""}
            className="form-input"
            placeholder="e.g. Living Room, Garage"
          />
        </div>
        <div className="form-field">
          <label htmlFor="description" className="form-label">
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={2}
            defaultValue={room?.description ?? ""}
            className="form-input"
            placeholder="e.g. Main gathering space"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {submitLabel}
          </button>
          <Link to={cancelTo} className="btn-secondary">
            Cancel
          </Link>
        </div>
      </Form>
      {room?.id != null && (
        <Form
          method="post"
          className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          onSubmit={(e) => {
            if (!confirm("Delete this room and all its items?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <button type="submit" className="btn-danger">
            Delete room
          </button>
        </Form>
      )}
    </div>
  );
}

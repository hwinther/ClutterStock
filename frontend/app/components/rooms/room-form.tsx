import { Form, Link } from "react-router";
import type { RoomResponse } from "~/api/client";
import { fieldError } from "~/lib/forms";

type RoomFormProps = {
  title: string;
  submitLabel: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  room?: RoomResponse | null;
  locationId: number;
  cancelTo: string;
};

export function RoomForm({
  title,
  submitLabel,
  error,
  fieldErrors,
  room,
  locationId: _locationId,
  cancelTo,
}: RoomFormProps) {
  const nameError = fieldError(fieldErrors, "name");
  const descriptionError = fieldError(fieldErrors, "description");
  if (room === null) {
    return (
      <div className="card-padded">
        <p className="text-muted">Room not found.</p>
        <Link to={cancelTo} className="link-text" style={{ display: "inline-block", marginTop: 8 }}>
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
            aria-invalid={nameError ? true : undefined}
          />
          {nameError && <p className="text-error" style={{ marginTop: 4 }}>{nameError}</p>}
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
            aria-invalid={descriptionError ? true : undefined}
          />
          {descriptionError && <p className="text-error" style={{ marginTop: 4 }}>{descriptionError}</p>}
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
          style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}
          onSubmit={(e) => {
            if (!confirm("Delete this room and all its items?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <button type="submit" className="btn-danger">Delete room</button>
        </Form>
      )}
    </div>
  );
}

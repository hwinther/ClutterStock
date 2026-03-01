import { Form, Link } from "react-router";
import type { LocationResponse } from "~/api/client";

type LocationFormProps = {
  title: string;
  submitLabel: string;
  error?: string;
  location?: LocationResponse | null;
};

export function LocationForm({
  title,
  submitLabel,
  error,
  location,
}: LocationFormProps) {
  if (location === null) {
    return (
      <div className="card-padded">
        <p className="text-muted">Location not found.</p>
        <Link to="/locations" className="link-text mt-2 inline-block">
          Back to locations
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
            autoFocus={!location}
            defaultValue={location?.name ?? ""}
            className="form-input"
            placeholder="e.g. Home, Office"
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
            defaultValue={location?.description ?? ""}
            className="form-input"
            placeholder="e.g. Main residence"
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {submitLabel}
          </button>
          <Link to="/locations" className="btn-secondary">
            Cancel
          </Link>
        </div>
      </Form>
      {location?.id != null && (
        <Form
          method="post"
          className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          onSubmit={(e) => {
            if (!confirm("Delete this location and all its rooms and items?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <button type="submit" className="btn-danger">
            Delete location
          </button>
        </Form>
      )}
    </div>
  );
}

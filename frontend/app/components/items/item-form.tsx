import { Form, Link } from "react-router";
import type { ItemResponse } from "~/api/client";

type ItemFormProps = {
  title: string;
  submitLabel: string;
  error?: string;
  item?: ItemResponse | null;
  roomId: number;
  cancelTo: string;
};

export function ItemForm({
  title,
  submitLabel,
  error,
  item,
  roomId: _roomId,
  cancelTo,
}: ItemFormProps) {
  if (item === null) {
    return (
      <div className="card-padded">
        <p className="text-muted">Item not found.</p>
        <Link to={cancelTo} className="link-text mt-2 inline-block">
          Back to items
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
            autoFocus={!item}
            defaultValue={item?.name ?? ""}
            className="form-input"
            placeholder="e.g. Vintage Lamp"
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
            defaultValue={item?.description ?? ""}
            className="form-input"
            placeholder="e.g. Brass table lamp, 1980s"
          />
        </div>
        <div className="form-field">
          <label htmlFor="category" className="form-label">
            Category (optional)
          </label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={item?.category ?? ""}
            className="form-input"
            placeholder="e.g. Electronics, Furniture"
          />
        </div>
        <div className="form-field">
          <label htmlFor="notes" className="form-label">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            defaultValue={item?.notes ?? ""}
            className="form-input"
            placeholder="e.g. Needs new shade"
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
      {item?.id != null && (
        <Form
          method="post"
          className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700"
          onSubmit={(e) => {
            if (!confirm("Delete this item?")) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="_action" value="delete" />
          <button type="submit" className="btn-danger">
            Delete item
          </button>
        </Form>
      )}
    </div>
  );
}

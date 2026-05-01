import { Form, Link } from "react-router";
import type { ItemResponse } from "~/api/client";
import { fieldError } from "~/lib/forms";

type ItemFormProps = {
  title: string;
  submitLabel: string;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  item?: ItemResponse | null;
  roomId: number;
  cancelTo: string;
};

export function ItemForm({ title, submitLabel, error, fieldErrors, item, roomId: _roomId, cancelTo }: ItemFormProps) {
  const nameError = fieldError(fieldErrors, "name");
  const descriptionError = fieldError(fieldErrors, "description");
  const categoryError = fieldError(fieldErrors, "category");
  const notesError = fieldError(fieldErrors, "notes");
  if (item === null) {
    return (
      <div className="card-padded">
        <p className="text-muted">Item not found.</p>
        <Link to={cancelTo} className="link-text" style={{ display: "inline-block", marginTop: 8 }}>
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
          <label htmlFor="name" className="form-label">Name</label>
          <input id="name" name="name" type="text" required autoFocus={!item}
            defaultValue={item?.name ?? ""} className="form-input" placeholder="e.g. Vintage Lamp"
            aria-invalid={nameError ? true : undefined} />
          {nameError && <p className="text-error" style={{ marginTop: 4 }}>{nameError}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="description" className="form-label">Description (optional)</label>
          <textarea id="description" name="description" rows={2}
            defaultValue={item?.description ?? ""} className="form-input" placeholder="e.g. Brass table lamp, 1980s"
            aria-invalid={descriptionError ? true : undefined} />
          {descriptionError && <p className="text-error" style={{ marginTop: 4 }}>{descriptionError}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="category" className="form-label">Category (optional)</label>
          <input id="category" name="category" type="text"
            defaultValue={item?.category ?? ""} className="form-input" placeholder="e.g. Electronics, Furniture"
            aria-invalid={categoryError ? true : undefined} />
          {categoryError && <p className="text-error" style={{ marginTop: 4 }}>{categoryError}</p>}
        </div>
        <div className="form-field">
          <label htmlFor="notes" className="form-label">Notes (optional)</label>
          <textarea id="notes" name="notes" rows={2}
            defaultValue={item?.notes ?? ""} className="form-input" placeholder="e.g. Needs new shade"
            aria-invalid={notesError ? true : undefined} />
          {notesError && <p className="text-error" style={{ marginTop: 4 }}>{notesError}</p>}
        </div>
        <div className="form-actions">
          <button type="submit" className="btn-primary">{submitLabel}</button>
          <Link to={cancelTo} className="btn-secondary">Cancel</Link>
        </div>
      </Form>
      {item?.id != null && (
        <Form
          method="post"
          style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--c-border)" }}
          onSubmit={(e) => { if (!confirm("Delete this item?")) e.preventDefault(); }}
        >
          <input type="hidden" name="_action" value="delete" />
          <button type="submit" className="btn-danger">Delete item</button>
        </Form>
      )}
    </div>
  );
}

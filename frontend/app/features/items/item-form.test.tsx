import type { ComponentProps } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import type { ItemResponse } from "~/api/client";
import { ItemForm } from "./item-form";

const cancelTo = "/locations/1/rooms/2/items";

function renderItemForm(props: Partial<ComponentProps<typeof ItemForm>> = {}) {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: (
          <ItemForm
            title="Item"
            submitLabel="Save"
            roomId={2}
            cancelTo={cancelTo}
            {...props}
          />
        ),
      },
    ],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("ItemForm", () => {
  it("shows not-found state and back link when item is null", () => {
    renderItemForm({ item: null });
    expect(screen.getByText(/item not found/i)).toBeInTheDocument();
    const back = screen.getByRole("link", { name: /back to items/i });
    expect(back).toHaveAttribute("href", cancelTo);
  });

  it("shows server error message when error is set", () => {
    renderItemForm({ error: "Could not save item." });
    expect(screen.getByText("Could not save item.")).toBeInTheDocument();
  });

  it("renders create form without delete when item is undefined", () => {
    renderItemForm({ item: undefined, submitLabel: "Create" });
    expect(screen.getByRole("heading", { name: "Item" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete item/i })).not.toBeInTheDocument();
  });

  it("renders delete control when editing an item with id", () => {
    const item = {
      id: 42,
      name: "Lamp",
      description: null,
      category: null,
      notes: null,
      roomId: 2,
    } as ItemResponse;
    renderItemForm({ item, submitLabel: "Update" });
    expect(screen.getByRole("button", { name: /delete item/i })).toBeInTheDocument();
  });
});

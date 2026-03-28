import type { ComponentProps } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import type { ItemResponse } from "~/api/client";
import { routes } from "~/constants/routes";
import { ItemsList } from "./items-list";

function renderItemsList(props: ComponentProps<typeof ItemsList>) {
  const router = createMemoryRouter(
    [{ path: "/", element: <ItemsList {...props} /> }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("ItemsList", () => {
  it("shows empty state and link to add first item", () => {
    renderItemsList({
      locationId: 1,
      roomId: 2,
      roomName: "Office",
      items: [],
    });
    expect(
      screen.getByText(/no items in office yet\. add the first item\./i),
    ).toBeInTheDocument();
    const add = screen.getByRole("link", { name: /add item/i });
    expect(add).toHaveAttribute(
      "href",
      routes.locations.roomItemsNew(1, 2),
    );
  });

  it("lists item names and edit link when items exist", () => {
    const items = [
      { id: 10, name: "Chair", description: null, category: null, notes: null, roomId: 2 },
    ] as ItemResponse[];
    renderItemsList({
      locationId: 1,
      roomId: 2,
      roomName: "Office",
      items,
    });
    expect(screen.getByText("Chair")).toBeInTheDocument();
    const edit = screen.getByRole("link", { name: /^edit$/i });
    expect(edit).toHaveAttribute(
      "href",
      routes.locations.itemEdit(1, 2, 10),
    );
  });

  it("shows description and category line when present", () => {
    const items = [
      {
        id: 1,
        name: "Desk",
        description: "Wood",
        category: "Furniture",
        notes: null,
        roomId: 2,
      },
    ] as ItemResponse[];
    renderItemsList({
      locationId: 1,
      roomId: 2,
      roomName: "Office",
      items,
    });
    expect(screen.getByText("Wood · Furniture")).toBeInTheDocument();
  });
});

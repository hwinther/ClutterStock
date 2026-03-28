import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import type { LocationResponse } from "~/api/client";
import { routes } from "~/constants/routes";
import { LocationsList } from "./locations-list";

function renderLocationsList(locations: LocationResponse[]) {
  const router = createMemoryRouter(
    [{ path: "/", element: <LocationsList locations={locations} /> }],
    { initialEntries: ["/"] },
  );
  return render(<RouterProvider router={router} />);
}

describe("LocationsList", () => {
  it("shows empty state and link to add location", () => {
    renderLocationsList([]);
    expect(
      screen.getByText(
        /no locations yet\. add your first location to get started\./i,
      ),
    ).toBeInTheDocument();
    const add = screen.getByRole("link", { name: /add location/i });
    expect(add).toHaveAttribute("href", routes.locations.new());
  });

  it("lists location names and room link when locations exist", () => {
    const locations = [
      { id: 5, name: "Home", description: null },
    ] as LocationResponse[];
    renderLocationsList(locations);
    expect(screen.getByText("Home")).toBeInTheDocument();
    const rooms = screen.getByRole("link", { name: /^rooms$/i });
    expect(rooms).toHaveAttribute("href", routes.locations.rooms(5));
    const edit = screen.getByRole("link", { name: /^edit$/i });
    expect(edit).toHaveAttribute("href", routes.locations.edit(5));
  });

  it("shows description when present", () => {
    const locations = [
      { id: 1, name: "Garage", description: "Main storage" },
    ] as LocationResponse[];
    renderLocationsList(locations);
    expect(screen.getByText("Main storage")).toBeInTheDocument();
  });
});

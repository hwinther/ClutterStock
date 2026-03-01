import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import { Welcome } from "./welcome";

function renderWelcome() {
  const router = createMemoryRouter(
    [{ path: "/", element: <Welcome /> }],
    { initialEntries: ["/"] }
  );
  return render(<RouterProvider router={router} />);
}

describe("Welcome", () => {
  it("renders a link to Locations", () => {
    renderWelcome();
    expect(screen.getByRole("link", { name: /locations/i })).toBeInTheDocument();
  });

  it("renders the welcome nav", () => {
    renderWelcome();
    expect(screen.getByText(/what's next\?/i)).toBeInTheDocument();
  });
});

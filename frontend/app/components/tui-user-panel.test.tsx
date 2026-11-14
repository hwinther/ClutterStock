import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { SessionUser } from "~/lib/session.server";
import { TuiUserPanel } from "./tui-user-panel";

function setup(user: SessionUser, open = true) {
  const onClose = vi.fn();
  const onSignOut = vi.fn();
  const view = render(
    <>
      <TuiUserPanel user={user} open={open} onClose={onClose} onSignOut={onSignOut} />
      <button type="button">elsewhere</button>
    </>,
  );
  return { ...view, onClose, onSignOut };
}

const panel = () => screen.getByRole("dialog", { name: "Account" });

describe("TuiUserPanel", () => {
  it("renders nothing while closed", () => {
    setup({ sub: "abc" }, false);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("lists the user and focuses the first action", () => {
    setup({
      sub: "abc",
      name: "Ada",
      preferred_username: "ada",
      email: "a@x.test",
      groups: ["g1", "", "g2"],
    });
    expect(screen.getByText("─[ user · Ada ]─")).toBeInTheDocument();
    expect(panel()).toHaveTextContent(/username\s*:\s*ada/);
    expect(panel()).toHaveTextContent(/email\s*:\s*a@x\.test/);
    expect(panel()).toHaveTextContent(/groups\s*:\s*g1, g2/);
    expect(screen.getByTitle("abc")).toHaveTextContent("abc");
    expect(screen.getByRole("button", { name: "[s] sign out" })).toHaveFocus();
  });

  it("shows (none) for what the user lacks", () => {
    setup({ sub: "abc" });
    expect(screen.getByText("─[ user · abc ]─")).toBeInTheDocument();
    expect(panel()).toHaveTextContent(/username\s*:\s*\(none\)/);
    expect(panel()).toHaveTextContent(/email\s*:\s*\(none\)/);
    expect(panel()).toHaveTextContent(/groups\s*:\s*\(none\)/);
  });

  it("signs out with s only while focus is inside", () => {
    const { onSignOut } = setup({ sub: "abc" });
    fireEvent.keyDown(window, { key: "s" });
    expect(onSignOut).toHaveBeenCalledTimes(1);

    screen.getByRole("button", { name: "elsewhere" }).focus();
    fireEvent.keyDown(window, { key: "s" });
    fireEvent.keyDown(window, { key: "x" });
    expect(onSignOut).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "[s] sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(2);
  });

  it("closes on Escape, the close button and a click outside", () => {
    const { onClose } = setup({ sub: "abc" });
    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "[Esc] close" }));
    fireEvent.mouseDown(panel());
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.mouseDown(screen.getByRole("button", { name: "elsewhere" }));
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

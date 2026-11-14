import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { testApiServer } from "./msw/server";

beforeAll(() => {
  testApiServer.listen({ onUnhandledFrame: "warn" });
});

afterEach(() => {
  testApiServer.resetHandlers();
});

afterAll(() => {
  testApiServer.close();
});

// jsdom has no layout, so it leaves out the element scrolling APIs; components that keep a list or
// a log scrolled call them in effects. (The *.server tests run in the node environment: no DOM.)
if (typeof Element !== "undefined") {
  Element.prototype.scrollTo ??= function scrollTo() {};
  Element.prototype.scrollIntoView ??= function scrollIntoView() {};
}

// jsdom has no <dialog> methods either: open/close toggle the attribute, and close fires the
// "close" event the way a browser does.
if (typeof HTMLDialogElement !== "undefined") {
  HTMLDialogElement.prototype.showModal ??= function showModal(this: HTMLDialogElement) {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close ??= function close(this: HTMLDialogElement) {
    if (!this.hasAttribute("open")) return;
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
}

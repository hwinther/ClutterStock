import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll } from "vitest";
import { testApiServer } from "./msw/server";

beforeAll(() => {
  testApiServer.listen({ onUnhandledRequest: "warn" });
});

afterEach(() => {
  testApiServer.resetHandlers();
});

afterAll(() => {
  testApiServer.close();
});

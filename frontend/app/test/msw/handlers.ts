import { apiHttp } from "./openapi-http";

/**
 * Sensible defaults so tests do not hit the network. Override per test with
 * `testApiServer.use(...)` when you need specific payloads or status codes.
 */
export const defaultApiHandlers = [
  apiHttp.get("/locations", ({ response }) => response(200).json([])),
  apiHttp.get("/locations/{id}", ({ response }) => response(404).empty()),
  apiHttp.get("/rooms", ({ response }) => response(200).json([])),
  apiHttp.get("/rooms/{id}", ({ response }) => response(404).empty()),
  apiHttp.get("/items", ({ response }) => response(200).json([])),
  apiHttp.get("/items/{id}", ({ response }) => response(404).empty()),
];

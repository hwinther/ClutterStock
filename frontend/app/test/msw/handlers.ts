import { apiHttp } from "./openapi-http";

/**
 * Sensible defaults so tests do not hit the network. Override per test with
 * `testApiServer.use(...)` when you need specific payloads or status codes.
 */
export const defaultApiHandlers = [
  apiHttp.get("/api/v1/locations", ({ response }) => response(200).json([])),
  apiHttp.get("/api/v1/locations/{id}", ({ response }) => response(404).empty()),
  apiHttp.get("/api/v1/rooms", ({ response }) => response(200).json([])),
  apiHttp.get("/api/v1/rooms/{id}", ({ response }) => response(404).empty()),
  apiHttp.get("/api/v1/items", ({ response }) => response(200).json([])),
  apiHttp.get("/api/v1/items/{id}", ({ response }) => response(404).empty()),
];

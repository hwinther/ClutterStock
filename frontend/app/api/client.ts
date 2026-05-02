import type { components } from "~/api/types";
import { del, get, post, put } from "~/api/typed";
import { isApiProblem } from "~/api/problem";

async function nullOn404<T>(promise: Promise<T>): Promise<T | null> {
  try {
    return await promise;
  } catch (error) {
    // The wrapper throws Response so problem details survive RR7's SSR
    // serialization; ApiProblemError is the legacy/test path.
    if (error instanceof Response && error.status === 404) return null;
    if (isApiProblem(error) && error.status === 404) return null;
    throw error;
  }
} // Test

/* Locations */
export type LocationResponse =
  components["schemas"]["ClutterStock.Contracts.Locations.LocationResponse"];
export type AddLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.AddLocationRequest"];
export type UpdateLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.UpdateLocationRequest"];

export const getLocations = (request?: Request): Promise<LocationResponse[]> =>
  get("/api/v1/locations", { ssrRequest: request });

export const getLocation = (
  id: number,
  request?: Request,
): Promise<LocationResponse | null> =>
  nullOn404(
    get("/api/v1/locations/{id}", { params: { id }, ssrRequest: request }),
  );

export const createLocation = (
  body: AddLocationRequest,
  request?: Request,
): Promise<LocationResponse> =>
  post("/api/v1/locations", { body, ssrRequest: request });

export const updateLocation = (
  id: number,
  body: UpdateLocationRequest,
  request?: Request,
): Promise<LocationResponse> =>
  put("/api/v1/locations/{id}", { params: { id }, body, ssrRequest: request });

export const deleteLocation = (id: number, request?: Request): Promise<void> =>
  del("/api/v1/locations/{id}", { params: { id }, ssrRequest: request });

/* Rooms */
export type RoomResponse =
  components["schemas"]["ClutterStock.Contracts.Rooms.RoomResponse"];
export type AddRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.AddRoomRequest"];
export type UpdateRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.UpdateRoomRequest"];

export const getRooms = (request?: Request): Promise<RoomResponse[]> =>
  get("/api/v1/rooms", { ssrRequest: request });

export const getRoom = (
  id: number,
  request?: Request,
): Promise<RoomResponse | null> =>
  nullOn404(get("/api/v1/rooms/{id}", { params: { id }, ssrRequest: request }));

export const createRoom = (
  body: AddRoomRequest,
  request?: Request,
): Promise<RoomResponse> =>
  post("/api/v1/rooms", { body, ssrRequest: request });

export const updateRoom = (
  id: number,
  body: UpdateRoomRequest,
  request?: Request,
): Promise<RoomResponse> =>
  put("/api/v1/rooms/{id}", { params: { id }, body, ssrRequest: request });

export const deleteRoom = (id: number, request?: Request): Promise<void> =>
  del("/api/v1/rooms/{id}", { params: { id }, ssrRequest: request });

/* Items */
export type ItemResponse =
  components["schemas"]["ClutterStock.Contracts.Items.ItemResponse"];
export type AddItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.AddItemRequest"];
export type UpdateItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.UpdateItemRequest"];

export const getItems = (request?: Request): Promise<ItemResponse[]> =>
  get("/api/v1/items", { ssrRequest: request });

export const getItem = (
  id: number,
  request?: Request,
): Promise<ItemResponse | null> =>
  nullOn404(get("/api/v1/items/{id}", { params: { id }, ssrRequest: request }));

export const createItem = (
  body: AddItemRequest,
  request?: Request,
): Promise<ItemResponse> =>
  post("/api/v1/items", { body, ssrRequest: request });

export const updateItem = (
  id: number,
  body: UpdateItemRequest,
  request?: Request,
): Promise<ItemResponse> =>
  put("/api/v1/items/{id}", { params: { id }, body, ssrRequest: request });

export const deleteItem = (id: number, request?: Request): Promise<void> =>
  del("/api/v1/items/{id}", { params: { id }, ssrRequest: request });

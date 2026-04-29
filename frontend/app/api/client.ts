import type { components } from "~/api/types";
import { apiFetch } from "~/api/http";

export type LocationResponse =
  components["schemas"]["ClutterStock.Contracts.Locations.LocationResponse"];
export type AddLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.AddLocationRequest"];
export type UpdateLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.UpdateLocationRequest"];

export async function getLocations(request?: Request): Promise<LocationResponse[]> {
  const res = await apiFetch("/locations", {}, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getLocation(
  id: number,
  request?: Request,
): Promise<LocationResponse | null> {
  const res = await apiFetch(`/locations/${id}`, {}, request);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createLocation(
  body: AddLocationRequest,
  request?: Request,
): Promise<LocationResponse> {
  const res = await apiFetch("/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateLocation(
  id: number,
  body: UpdateLocationRequest,
  request?: Request,
): Promise<LocationResponse> {
  const res = await apiFetch(`/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteLocation(id: number, request?: Request): Promise<void> {
  const res = await apiFetch(`/locations/${id}`, { method: "DELETE" }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

/* Rooms */
export type RoomResponse =
  components["schemas"]["ClutterStock.Contracts.Rooms.RoomResponse"];
export type AddRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.AddRoomRequest"];
export type UpdateRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.UpdateRoomRequest"];

export async function getRooms(request?: Request): Promise<RoomResponse[]> {
  const res = await apiFetch("/rooms", {}, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getRoom(id: number, request?: Request): Promise<RoomResponse | null> {
  const res = await apiFetch(`/rooms/${id}`, {}, request);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createRoom(body: AddRoomRequest, request?: Request): Promise<RoomResponse> {
  const res = await apiFetch("/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateRoom(
  id: number,
  body: UpdateRoomRequest,
  request?: Request,
): Promise<RoomResponse> {
  const res = await apiFetch(`/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteRoom(id: number, request?: Request): Promise<void> {
  const res = await apiFetch(`/rooms/${id}`, { method: "DELETE" }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

/* Items */
export type ItemResponse =
  components["schemas"]["ClutterStock.Contracts.Items.ItemResponse"];
export type AddItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.AddItemRequest"];
export type UpdateItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.UpdateItemRequest"];

export async function getItems(request?: Request): Promise<ItemResponse[]> {
  const res = await apiFetch("/items", {}, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getItem(id: number, request?: Request): Promise<ItemResponse | null> {
  const res = await apiFetch(`/items/${id}`, {}, request);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createItem(body: AddItemRequest, request?: Request): Promise<ItemResponse> {
  const res = await apiFetch("/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateItem(
  id: number,
  body: UpdateItemRequest,
  request?: Request,
): Promise<ItemResponse> {
  const res = await apiFetch(`/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteItem(id: number, request?: Request): Promise<void> {
  const res = await apiFetch(`/items/${id}`, { method: "DELETE" }, request);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

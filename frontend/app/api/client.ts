import type { components } from "~/api/types";
import { getApiBase } from "~/constants/api";

export type LocationResponse =
  components["schemas"]["ClutterStock.Contracts.Locations.LocationResponse"];
export type AddLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.AddLocationRequest"];
export type UpdateLocationRequest =
  components["schemas"]["ClutterStock.Contracts.Locations.UpdateLocationRequest"];

export async function getLocations(): Promise<LocationResponse[]> {
  const res = await fetch(`${getApiBase()}/locations`);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getLocation(
  id: number,
): Promise<LocationResponse | null> {
  const res = await fetch(`${getApiBase()}/locations/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createLocation(
  body: AddLocationRequest,
): Promise<LocationResponse> {
  const res = await fetch(`${getApiBase()}/locations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateLocation(
  id: number,
  body: UpdateLocationRequest,
): Promise<LocationResponse> {
  const res = await fetch(`${getApiBase()}/locations/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteLocation(id: number): Promise<void> {
  const res = await fetch(`${getApiBase()}/locations/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

/* Rooms */
export type RoomResponse =
  components["schemas"]["ClutterStock.Contracts.Rooms.RoomResponse"];
export type AddRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.AddRoomRequest"];
export type UpdateRoomRequest =
  components["schemas"]["ClutterStock.Contracts.Rooms.UpdateRoomRequest"];

export async function getRooms(): Promise<RoomResponse[]> {
  const res = await fetch(`${getApiBase()}/rooms`);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getRoom(id: number): Promise<RoomResponse | null> {
  const res = await fetch(`${getApiBase()}/rooms/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createRoom(body: AddRoomRequest): Promise<RoomResponse> {
  const res = await fetch(`${getApiBase()}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateRoom(
  id: number,
  body: UpdateRoomRequest,
): Promise<RoomResponse> {
  const res = await fetch(`${getApiBase()}/rooms/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteRoom(id: number): Promise<void> {
  const res = await fetch(`${getApiBase()}/rooms/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

/* Items */
export type ItemResponse =
  components["schemas"]["ClutterStock.Contracts.Items.ItemResponse"];
export type AddItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.AddItemRequest"];
export type UpdateItemRequest =
  components["schemas"]["ClutterStock.Contracts.Items.UpdateItemRequest"];

export async function getItems(): Promise<ItemResponse[]> {
  const res = await fetch(`${getApiBase()}/items`);
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function getItem(id: number): Promise<ItemResponse | null> {
  const res = await fetch(`${getApiBase()}/items/${id}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function createItem(body: AddItemRequest): Promise<ItemResponse> {
  const res = await fetch(`${getApiBase()}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function updateItem(
  id: number,
  body: UpdateItemRequest,
): Promise<ItemResponse> {
  const res = await fetch(`${getApiBase()}/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
  return res.json();
}

export async function deleteItem(id: number): Promise<void> {
  const res = await fetch(`${getApiBase()}/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Response(await res.text(), { status: res.status });
}

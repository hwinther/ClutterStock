import { Link, redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.items.index";
import { deleteItem, getLocation, getRoom, getItems } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { ItemsList } from "~/components/items";

export async function loader({ params }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  const roomId = Number(params.roomId);
  if (Number.isNaN(locationId) || Number.isNaN(roomId)) {
    throw new Response("Not found", { status: 404 });
  }
  const [location, room, allItems] = await Promise.all([
    getLocation(locationId),
    getRoom(roomId),
    getItems(),
  ]);
  if (!location || !room || room.locationId !== locationId) {
    throw new Response("Not found", { status: 404 });
  }
  const items = allItems.filter((i) => i.roomId === roomId);
  return { location, room, items };
}

export async function action({ request, params }: Route.ActionArgs) {
  const locationId = Number(params.id);
  const roomId = Number(params.roomId);
  if (Number.isNaN(locationId) || Number.isNaN(roomId)) {
    throw new Response("Not found", { status: 404 });
  }
  const formData = await request.formData();
  if (formData.get("_action") !== "delete") return null;
  const itemId = Number(formData.get("id"));
  if (Number.isNaN(itemId)) return null;
  await deleteItem(itemId);
  return redirect(`/locations/${locationId}/rooms/${roomId}/items`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const roomName = loaderData?.room?.name ?? "Room";
  return [{ title: `Items · ${roomName} | ClutterStock` }];
}

export default function LocationsRoomsItemsIndex({
  loaderData,
}: Route.ComponentProps) {
  const { location, room, items } = loaderData;
  const locationId = location.id!;
  const roomId = room.id!;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: "Locations", to: "/locations" },
          { label: location.name ?? "Location", to: `/locations/${locationId}/edit` },
          { label: "Rooms", to: `/locations/${locationId}/rooms` },
          { label: room.name ?? "Room", to: `/locations/${locationId}/rooms/${roomId}/edit` },
          { label: "Items" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <h2 className="page-title">Items</h2>
        <Link
          to={`/locations/${locationId}/rooms/${roomId}/items/new`}
          className="btn-primary"
        >
          Add item
        </Link>
      </div>
      <ItemsList
        locationId={locationId}
        roomId={roomId}
        roomName={room.name ?? "this room"}
        items={items}
      />
    </>
  );
}

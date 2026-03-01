import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.items.edit";
import { deleteItem, getLocation, getRoom, getItem, updateItem } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { ItemForm } from "~/components/items";

export async function loader({ params }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  const roomId = Number(params.roomId);
  const itemId = Number(params.itemId);
  if (
    Number.isNaN(locationId) ||
    Number.isNaN(roomId) ||
    Number.isNaN(itemId)
  ) {
    throw new Response("Not found", { status: 404 });
  }
  const [location, room, item] = await Promise.all([
    getLocation(locationId),
    getRoom(roomId),
    getItem(itemId),
  ]);
  if (
    !location ||
    !room ||
    !item ||
    room.locationId !== locationId ||
    item.roomId !== roomId
  ) {
    throw new Response("Not found", { status: 404 });
  }
  return { location, room, item } as const;
}

export async function action({ request, params }: Route.ActionArgs) {
  const itemId = Number(params.itemId);
  const roomId = Number(params.roomId);
  const locationId = Number(params.id);
  if (Number.isNaN(itemId) || Number.isNaN(roomId) || Number.isNaN(locationId)) {
    throw new Response("Not found", { status: 404 });
  }
  const formData = await request.formData();
  if (formData.get("_action") === "delete") {
    await deleteItem(itemId);
    return redirect(
      `/locations/${locationId}/rooms/${roomId}/items`
    );
  }
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const notes = formData.get("notes");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required" };
  }
  await updateItem(itemId, {
    roomId,
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : undefined,
    category:
      typeof category === "string" && category.trim()
        ? category.trim()
        : undefined,
    notes:
      typeof notes === "string" && notes.trim() ? notes.trim() : undefined,
  });
  return redirect(
    `/locations/${locationId}/rooms/${roomId}/items`
  );
}

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.item?.name ?? "Item";
  return [{ title: `Edit ${name} | ClutterStock` }];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function LocationsRoomsItemsEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  if (!loaderData) return null;
  // Assertion needed: generated Route.ComponentProps can type loaderData such that destructuring yields never
  const { location, room, item } = loaderData as LoaderData;
  const locationId = location.id!;
  const roomId = room.id!;
  const error =
    actionData != null &&
    typeof actionData === "object" &&
    "error" in actionData
      ? (actionData as { error: string }).error
      : undefined;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: "Locations", to: "/locations" },
          { label: location.name ?? "Location", to: `/locations/${locationId}/edit` },
          { label: "Rooms", to: `/locations/${locationId}/rooms` },
          { label: room.name ?? "Room", to: `/locations/${locationId}/rooms/${roomId}/edit` },
          { label: "Items", to: `/locations/${locationId}/rooms/${roomId}/items` },
          { label: item.name ?? "Item" },
        ]}
      />
      <ItemForm
        title="Edit item"
        submitLabel="Save"
        error={error}
        item={item}
        roomId={roomId}
        cancelTo={`/locations/${locationId}/rooms/${roomId}/items`}
      />
    </>
  );
}

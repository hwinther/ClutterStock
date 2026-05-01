import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.items.new";
import { getLocation, getRoom, createItem } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { ItemForm } from "~/components/items";
import { tryApi } from "~/lib/action-helpers.server";
import { useToastFromActionData } from "~/lib/toasts";
import { pushFlash } from "~/lib/toasts.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  const roomId = Number(params.roomId);
  if (Number.isNaN(locationId) || Number.isNaN(roomId)) {
    throw new Response("Not found", { status: 404 });
  }
  const [location, room] = await Promise.all([
    getLocation(locationId, request),
    getRoom(roomId, request),
  ]);
  if (!location || !room || room.locationId !== locationId) {
    throw new Response("Not found", { status: 404 });
  }
  return { location, room };
}

export async function action({ request, params }: Route.ActionArgs) {
  const roomId = Number(params.roomId);
  const locationId = Number(params.id);
  if (Number.isNaN(roomId) || Number.isNaN(locationId)) {
    throw new Response("Not found", { status: 404 });
  }
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  const category = formData.get("category");
  const notes = formData.get("notes");
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false as const, error: "Name is required" };
  }
  const result = await tryApi(() =>
    createItem(
      {
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
      },
      request,
    ),
  );
  if (!result.ok) return result;
  await pushFlash(request, {
    kind: "success",
    message: `Item "${result.data.name}" created`,
  });
  return redirect(`/locations/${locationId}/rooms/${roomId}/items`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const roomName = loaderData?.room?.name ?? "Room";
  return [{ title: `Add item · ${roomName} | ClutterStock` }];
}

export default function LocationsRoomsItemsNew({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  useToastFromActionData(actionData);
  const { location, room } = loaderData;
  const locationId = location.id!;
  const roomId = room.id!;
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  const fieldErrors =
    actionData && "fieldErrors" in actionData ? actionData.fieldErrors : undefined;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: "Locations", to: "/locations" },
          { label: location.name ?? "Location", to: `/locations/${locationId}/edit` },
          { label: "Rooms", to: `/locations/${locationId}/rooms` },
          { label: room.name ?? "Room", to: `/locations/${locationId}/rooms/${roomId}/edit` },
          { label: "Items", to: `/locations/${locationId}/rooms/${roomId}/items` },
          { label: "Add item" },
        ]}
      />
      <ItemForm
        title="Add item"
        submitLabel="Create"
        error={error}
        fieldErrors={fieldErrors}
        roomId={roomId}
        cancelTo={`/locations/${locationId}/rooms/${roomId}/items`}
      />
    </>
  );
}

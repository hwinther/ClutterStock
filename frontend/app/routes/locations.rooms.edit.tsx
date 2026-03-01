import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.edit";
import { routes } from "~/constants/routes";
import { deleteRoom, getLocation, getRoom, updateRoom } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { RoomForm } from "~/features/rooms";

export async function loader({ params }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  const roomId = Number(params.roomId);
  if (Number.isNaN(locationId) || Number.isNaN(roomId)) {
    throw new Response("Not found", { status: 404 });
  }
  const [location, room] = await Promise.all([
    getLocation(locationId),
    getRoom(roomId),
  ]);
  if (!location || !room || room?.locationId !== locationId) {
    throw new Response("Not found", { status: 404 });
  }
  return { location, room } as const;
}

export async function action({ request, params }: Route.ActionArgs) {
  const roomId = Number(params.roomId);
  const locationId = Number(params.id);
  if (Number.isNaN(roomId) || Number.isNaN(locationId)) {
    throw new Response("Not found", { status: 404 });
  }
  const formData = await request.formData();
  if (formData.get("_action") === "delete") {
    await deleteRoom(roomId);
    return redirect(routes.locations.rooms(locationId));
  }
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required" };
  }
  await updateRoom(roomId, {
    locationId,
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : undefined,
  });
  return redirect(routes.locations.rooms(locationId));
}

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.room?.name ?? "Room";
  return [{ title: `Edit ${name} | ClutterStock` }];
}

type LoaderData = Awaited<ReturnType<typeof loader>>;

export default function LocationsRoomsEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  if (!loaderData) return null;
  // Assertion needed: generated Route.ComponentProps can type loaderData such that destructuring yields never
  const { location, room } = loaderData as LoaderData;
  const locationId = location.id!;
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
          { label: "Locations", to: routes.locations.list() },
          { label: location.name ?? "Location", to: routes.locations.edit(locationId) },
          { label: "Rooms", to: routes.locations.rooms(locationId) },
          { label: room.name ?? "Room" },
        ]}
      />
      <RoomForm
        title="Edit room"
        submitLabel="Save"
        error={error}
        room={room}
        locationId={locationId}
        cancelTo={routes.locations.rooms(locationId)}
      />
    </>
  );
}

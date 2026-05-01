import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.edit";
import { routes } from "~/constants/routes";
import { deleteRoom, getLocation, getRoom, updateRoom } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { RoomForm } from "~/features/rooms";
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
    const del = await tryApi(() => deleteRoom(roomId, request));
    if (!del.ok) return del;
    await pushFlash(request, { kind: "success", message: "Room deleted" });
    return redirect(routes.locations.rooms(locationId));
  }
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false as const, error: "Name is required" };
  }
  const result = await tryApi(() =>
    updateRoom(
      roomId,
      {
        locationId,
        name: name.trim(),
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : undefined,
      },
      request,
    ),
  );
  if (!result.ok) return result;
  await pushFlash(request, {
    kind: "success",
    message: `Room "${result.data.name}" updated`,
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
  useToastFromActionData(actionData);
  if (!loaderData) return null;
  const { location, room } = loaderData as LoaderData;
  const locationId = location.id!;
  const error =
    actionData != null &&
    typeof actionData === "object" &&
    "error" in actionData
      ? (actionData as { error: string }).error
      : undefined;
  const fieldErrors =
    actionData != null &&
    typeof actionData === "object" &&
    "fieldErrors" in actionData
      ? (actionData as { fieldErrors?: Record<string, string[]> }).fieldErrors
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
        fieldErrors={fieldErrors}
        room={room}
        locationId={locationId}
        cancelTo={routes.locations.rooms(locationId)}
      />
    </>
  );
}

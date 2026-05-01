import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.new";
import { getLocation, createRoom } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { RoomForm } from "~/components/rooms";
import { tryApi } from "~/lib/action-helpers.server";
import { useToastFromActionData } from "~/lib/toasts";
import { pushFlash } from "~/lib/toasts.server";

export async function loader({ params, request }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  if (Number.isNaN(locationId)) throw new Response("Not found", { status: 404 });
  const location = await getLocation(locationId, request);
  if (!location) throw new Response("Not found", { status: 404 });
  return { location };
}

export async function action({ request, params }: Route.ActionArgs) {
  const locationId = Number(params.id);
  if (Number.isNaN(locationId)) throw new Response("Not found", { status: 404 });
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false as const, error: "Name is required" };
  }
  const result = await tryApi(() =>
    createRoom(
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
    message: `Room "${result.data.name}" created`,
  });
  return redirect(`/locations/${locationId}/rooms`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.location?.name ?? "Location";
  return [{ title: `Add room · ${name} | ClutterStock` }];
}

export default function LocationsRoomsNew({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  useToastFromActionData(actionData);
  const location = loaderData.location;
  const locationId = location.id!;
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
          { label: "Add room" },
        ]}
      />
      <RoomForm
        title="Add room"
        submitLabel="Create"
        error={error}
        fieldErrors={fieldErrors}
        locationId={locationId}
        cancelTo={`/locations/${locationId}/rooms`}
      />
    </>
  );
}

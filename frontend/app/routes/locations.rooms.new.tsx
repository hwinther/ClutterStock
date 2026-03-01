import { redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.new";
import { getLocation, createRoom } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { RoomForm } from "~/components/rooms";

export async function loader({ params }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  if (Number.isNaN(locationId)) throw new Response("Not found", { status: 404 });
  const location = await getLocation(locationId);
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
    return { error: "Name is required" };
  }
  await createRoom({
    locationId,
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : undefined,
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
  const location = loaderData.location;
  const locationId = location.id!;
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;

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
        locationId={locationId}
        cancelTo={`/locations/${locationId}/rooms`}
      />
    </>
  );
}

import { Link, redirect } from "react-router";
import type { Route } from "./+types/locations.rooms.index";
import { deleteRoom, getLocation, getRooms } from "~/api/client";
import { Breadcrumb } from "~/components/breadcrumb";
import { RoomsList } from "~/components/rooms";

export async function loader({ params }: Route.LoaderArgs) {
  const locationId = Number(params.id);
  if (Number.isNaN(locationId)) throw new Response("Not found", { status: 404 });
  const [location, allRooms] = await Promise.all([
    getLocation(locationId),
    getRooms(),
  ]);
  if (!location) throw new Response("Not found", { status: 404 });
  const rooms = allRooms.filter((r) => r.locationId === locationId);
  return { location, rooms };
}

export async function action({ request, params }: Route.ActionArgs) {
  const locationId = Number(params.id);
  if (Number.isNaN(locationId)) throw new Response("Not found", { status: 404 });
  const formData = await request.formData();
  if (formData.get("_action") !== "delete") return null;
  const roomId = Number(formData.get("id"));
  if (Number.isNaN(roomId)) return null;
  await deleteRoom(roomId);
  return redirect(`/locations/${locationId}/rooms`);
}

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.location?.name ?? "Location";
  return [{ title: `Rooms · ${name} | ClutterStock` }];
}

export default function LocationsRoomsIndex({ loaderData }: Route.ComponentProps) {
  const { location, rooms } = loaderData;
  const locationId = location.id!;

  return (
    <>
      <Breadcrumb
        crumbs={[
          { label: "Locations", to: "/locations" },
          { label: location.name ?? "Location", to: `/locations/${locationId}/edit` },
          { label: "Rooms" },
        ]}
      />
      <div className="mb-6 flex items-center justify-between">
        <h2 className="page-title">Rooms</h2>
        <Link to={`/locations/${locationId}/rooms/new`} className="btn-primary">
          Add room
        </Link>
      </div>
      <RoomsList
        locationId={locationId}
        locationName={location.name ?? "this location"}
        rooms={rooms}
      />
    </>
  );
}

import { redirect } from "react-router";
import type { Route } from "./+types/locations.index";
import { deleteLocation, getLocations } from "~/api/client";
import { LocationsList } from "~/components/locations";

export function loader(_args: Route.LoaderArgs) {
  return getLocations();
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  if (formData.get("_action") !== "delete") return null;
  const id = Number(formData.get("id"));
  if (Number.isNaN(id)) return null;
  await deleteLocation(id);
  return redirect("/locations");
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Locations | ClutterStock" }];
}

export default function LocationsIndex({ loaderData }: Route.ComponentProps) {
  return <LocationsList locations={loaderData} />;
}

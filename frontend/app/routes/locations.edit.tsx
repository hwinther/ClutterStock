import { redirect } from "react-router";
import type { Route } from "./+types/locations.edit";
import { routes } from "~/constants/routes";
import { deleteLocation, getLocation, updateLocation } from "~/api/client";
import { LocationForm } from "~/features/locations";

export function loader({ params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (Number.isNaN(id)) throw new Response("Not found", { status: 404 });
  return getLocation(id);
}

export async function action({ request, params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (Number.isNaN(id)) throw new Response("Not found", { status: 404 });
  const formData = await request.formData();
  if (formData.get("_action") === "delete") {
    await deleteLocation(id);
    return redirect(routes.locations.list());
  }
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { error: "Name is required" };
  }
  await updateLocation(id, {
    name: name.trim(),
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : undefined,
  });
  return redirect(routes.locations.list());
}

export function meta({ loaderData }: Route.MetaArgs) {
  const name = loaderData?.name ?? "Location";
  return [{ title: `Edit ${name} | ClutterStock` }];
}

export default function LocationEdit({
  loaderData,
  actionData,
}: Route.ComponentProps) {
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  return (
    <LocationForm
      title="Edit location"
      submitLabel="Save"
      error={error}
      location={loaderData}
    />
  );
}

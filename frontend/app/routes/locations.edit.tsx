import { redirect } from "react-router";
import type { Route } from "./+types/locations.edit";
import { routes } from "~/constants/routes";
import { deleteLocation, getLocation, updateLocation } from "~/api/client";
import { LocationForm } from "~/features/locations";
import { tryApi } from "~/lib/action-helpers.server";
import { useToastFromActionData } from "~/lib/toasts";
import { pushFlash } from "~/lib/toasts.server";

export function loader({ params, request }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (Number.isNaN(id)) throw new Response("Not found", { status: 404 });
  return getLocation(id, request);
}

export async function action({ request, params }: Route.ActionArgs) {
  const id = Number(params.id);
  if (Number.isNaN(id)) throw new Response("Not found", { status: 404 });
  const formData = await request.formData();
  if (formData.get("_action") === "delete") {
    const del = await tryApi(() => deleteLocation(id, request));
    if (!del.ok) return del;
    await pushFlash(request, { kind: "success", message: "Location deleted" });
    return redirect(routes.locations.list());
  }
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false as const, error: "Name is required" };
  }
  const result = await tryApi(() =>
    updateLocation(
      id,
      {
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
    message: `Location "${result.data.name}" updated`,
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
  useToastFromActionData(actionData);
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  const fieldErrors =
    actionData && "fieldErrors" in actionData ? actionData.fieldErrors : undefined;
  return (
    <LocationForm
      title="Edit location"
      submitLabel="Save"
      error={error}
      fieldErrors={fieldErrors}
      location={loaderData}
    />
  );
}

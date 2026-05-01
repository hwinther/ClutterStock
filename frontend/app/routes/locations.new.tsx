import { redirect } from "react-router";
import type { Route } from "./+types/locations.new";
import { routes } from "~/constants/routes";
import { createLocation } from "~/api/client";
import { LocationForm } from "~/features/locations";
import { tryApi } from "~/lib/action-helpers.server";
import { useToastFromActionData } from "~/lib/toasts";
import { pushFlash } from "~/lib/toasts.server";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const description = formData.get("description");
  if (typeof name !== "string" || !name.trim()) {
    return { ok: false as const, error: "Name is required" };
  }
  const result = await tryApi(() =>
    createLocation(
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
    message: `Location "${result.data.name}" created`,
  });
  return redirect(routes.locations.list());
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Add location | ClutterStock" }];
}

export default function LocationNew({ actionData }: Route.ComponentProps) {
  useToastFromActionData(actionData);
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  const fieldErrors =
    actionData && "fieldErrors" in actionData ? actionData.fieldErrors : undefined;
  return (
    <LocationForm
      title="Add location"
      submitLabel="Create"
      error={error}
      fieldErrors={fieldErrors}
    />
  );
}

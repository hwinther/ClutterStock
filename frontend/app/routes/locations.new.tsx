import { redirect } from "react-router";
import type { Route } from "./+types/locations.new";
import { createLocation } from "~/api/client";
import { LocationForm } from "~/components/locations";

export function action({ request }: Route.ActionArgs) {
  return (async () => {
    const formData = await request.formData();
    const name = formData.get("name");
    const description = formData.get("description");
    if (typeof name !== "string" || !name.trim()) {
      return { error: "Name is required" };
    }
    await createLocation({
      name: name.trim(),
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : undefined,
    });
    return redirect("/locations");
  })();
}

export function meta(_args: Route.MetaArgs) {
  return [{ title: "Add location | ClutterStock" }];
}

export default function LocationNew({ actionData }: Route.ComponentProps) {
  const error =
    actionData && "error" in actionData ? actionData.error : undefined;
  return (
    <LocationForm
      title="Add location"
      submitLabel="Create"
      error={error}
    />
  );
}

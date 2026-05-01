import { redirect } from "react-router";
import type { Route } from "./+types/auth.signin";
import { generateAuthUrl } from "~/lib/oidc.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") || "/";
  const authUrl = await generateAuthUrl(request, returnTo);
  return redirect(authUrl);
}

export default function AuthSignIn() {
  return null;
}

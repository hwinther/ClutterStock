import { redirect } from "react-router";
import type { Route } from "./+types/auth.callback";
import { handleCallback } from "~/lib/oidc.server";
import { sessionCookie } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return redirect("/auth/signin");

  try {
    const { sid, returnTo } = await handleCallback(code, state, request);
    return redirect(returnTo, {
      headers: { "Set-Cookie": sessionCookie(sid) },
    });
  } catch (err) {
    if (err instanceof Response) throw err;
    console.error("[auth] callback error", err);
    return redirect("/auth/signin");
  }
}

export default function AuthCallback() {
  return null;
}

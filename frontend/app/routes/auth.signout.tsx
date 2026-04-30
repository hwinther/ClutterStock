import { redirect } from "react-router";
import type { Route } from "./+types/auth.signout";
import { buildLogoutUrl } from "~/lib/oidc.server";
import { clearCookie, destroySession, getSid, getSession } from "~/lib/session.server";

export async function loader({ request }: Route.LoaderArgs) {
  const sid = getSid(request);
  let idToken: string | undefined;

  if (sid) {
    const sess = await getSession(request);
    idToken = sess?.data.idToken;
    await destroySession(sid);
  }

  const logoutUrl = await buildLogoutUrl(idToken, request);
  return redirect(logoutUrl, {
    headers: { "Set-Cookie": clearCookie() },
  });
}

export default function AuthSignOut() {
  return null;
}

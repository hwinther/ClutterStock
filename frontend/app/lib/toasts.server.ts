import { getSession, updateSession } from "~/lib/session.server";
import type { ToastInput } from "~/lib/toasts";

/**
 * Queue a toast on the user's session. Drained on the next loader run so the
 * message survives a redirect (where useActionData() does not).
 */
export async function pushFlash(request: Request, flash: ToastInput): Promise<void> {
  const session = await getSession(request);
  if (!session) return; // unauthenticated requests can't carry flash messages
  const next = [...(session.data.flashes ?? []), flash];
  await updateSession(session.sid, { ...session.data, flashes: next });
}

/**
 * Read and clear pending flashes from the session. Call once per top-level
 * loader (root) so a single message is not delivered twice.
 */
export async function drainFlashes(request: Request): Promise<readonly ToastInput[]> {
  const session = await getSession(request);
  if (!session) return [];
  const flashes = session.data.flashes ?? [];
  if (flashes.length === 0) return flashes;
  await updateSession(session.sid, { ...session.data, flashes: [] });
  return flashes;
}

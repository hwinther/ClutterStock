import { createContext, use } from "react";

/**
 * The per-request CSP nonce, provided by entry.server.tsx around the server render. React Router's
 * own <Scripts>, <ScrollRestoration> and <Links> get it from <ServerRouter nonce>; this context is
 * for the app's own inline scripts (root.tsx).
 *
 * On the client there is no provider and the value is undefined. That is fine: browsers hide the
 * nonce attribute from the DOM, and the inline scripts have already run by the time React hydrates.
 */
export const NonceContext = createContext<string | undefined>(undefined);

export function useNonce(): string | undefined {
  return use(NonceContext);
}

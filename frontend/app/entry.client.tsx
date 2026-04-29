import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

import { startBrowserOpenTelemetry } from "~/otel/browser";
import { getUserManager, initAuth } from "~/auth/oidcClient";
import { setApiHeaderProvider, setApi401Handler } from "~/api/http";

startBrowserOpenTelemetry();

setApiHeaderProvider(async () => {
  const user = await getUserManager().getUser();
  if (!user || user.expired) return undefined;
  return { Authorization: `Bearer ${user.access_token}` };
});

setApi401Handler(() => {
  getUserManager().signinRedirect({ state: window.location.pathname + window.location.search });
});

initAuth();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>,
  );
});

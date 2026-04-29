import { useEffect } from "react";

export default function AuthSignIn() {
  useEffect(() => {
    async function signIn() {
      const { getUserManager } = await import("~/auth/oidcClient");
      const returnTo = new URLSearchParams(window.location.search).get("returnTo")
        ?? document.referrer
        ?? "/locations";
      await getUserManager().signinRedirect({ state: returnTo });
    }
    signIn();
  }, []);

  return (
    <main style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "60vh",
      color: "var(--c-fg-3)",
      fontSize: 13,
    }}>
      Redirecting to sign in…
    </main>
  );
}

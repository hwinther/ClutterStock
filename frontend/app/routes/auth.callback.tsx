import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const { getUserManager } = await import("~/auth/oidcClient");
        const user = await getUserManager().signinRedirectCallback();
        if (!cancelled) {
          navigate((user.state as string) ?? "/locations", { replace: true });
        }
      } catch (err) {
        console.error("[auth] OIDC callback error", err);
        if (!cancelled) navigate("/", { replace: true });
      }
    }

    handleCallback();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return null;
}

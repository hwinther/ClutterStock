import { createHash, randomBytes } from "node:crypto";
import { redis } from "./redis.server";
import {
  type Session,
  type SessionUser,
  createSession,
  destroySession,
  getSession,
  updateSession,
} from "./session.server";

const AUTHORITY = process.env.VITE_OIDC_AUTHORITY ?? "";
const CLIENT_ID = process.env.VITE_OIDC_CLIENT_ID ?? "";
const STATE_TTL = 10 * 60; // 10 minutes

// ── OIDC discovery ────────────────────────────────────────────────────────────

interface OIDCDiscovery {
  authorization_endpoint: string;
  token_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
}

let _discovery: OIDCDiscovery | undefined;

async function getDiscovery(): Promise<OIDCDiscovery> {
  if (_discovery) return _discovery;
  const res = await fetch(`${AUTHORITY}/.well-known/openid-configuration`);
  if (!res.ok) throw new Error(`OIDC discovery failed: ${res.status}`);
  _discovery = (await res.json()) as OIDCDiscovery;
  return _discovery;
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────

function generateVerifier(): string {
  return randomBytes(32).toString("base64url");
}

function challengeFor(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

// ── PKCE state store (Redis, short TTL) ───────────────────────────────────────

interface OIDCState {
  codeVerifier: string;
  returnTo: string;
}

async function saveOIDCState(state: string, data: OIDCState): Promise<void> {
  await redis().set(`oidc:state:${state}`, JSON.stringify(data), { EX: STATE_TTL });
}

async function consumeOIDCState(state: string): Promise<OIDCState | null> {
  const key = `oidc:state:${state}`;
  const raw = await redis().get(key);
  if (!raw) return null;
  await redis().del(key);
  return JSON.parse(raw) as OIDCState;
}

// ── Token response shape ──────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  id_token: string;
  expires_in: number;
  token_type: string;
}

function decodeJwtPayload<T>(jwt: string): T {
  const [, payload] = jwt.split(".");
  return JSON.parse(Buffer.from(payload!, "base64url").toString()) as T;
}

// ── Public API ────────────────────────────────────────────────────────────────

function redirectUri(request: Request): string {
  const origin = process.env.PUBLIC_ORIGIN ?? new URL(request.url).origin;
  return `${origin}/auth/callback`;
}

export async function generateAuthUrl(
  request: Request,
  returnTo = "/locations",
): Promise<string> {
  const { authorization_endpoint } = await getDiscovery();
  const state = randomBytes(16).toString("base64url");
  const codeVerifier = generateVerifier();

  await saveOIDCState(state, { codeVerifier, returnTo });

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    redirect_uri: redirectUri(request),
    scope: "openid profile email groups offline_access",
    state,
    code_challenge: challengeFor(codeVerifier),
    code_challenge_method: "S256",
  });

  return `${authorization_endpoint}?${params}`;
}

export async function handleCallback(
  code: string,
  state: string,
  request: Request,
): Promise<{ sid: string; returnTo: string }> {
  const oidcState = await consumeOIDCState(state);
  if (!oidcState) throw new Response("Invalid or expired state", { status: 400 });

  const { token_endpoint, userinfo_endpoint } = await getDiscovery();
  const res = await fetch(token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      redirect_uri: redirectUri(request),
      code,
      code_verifier: oidcState.codeVerifier,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Response(`Token exchange failed: ${body}`, { status: 502 });
  }

  const tokens = (await res.json()) as TokenResponse;

  // Prefer userinfo endpoint — id_token omits profile claims when no claims_policy is set
  let profile: SessionUser & Record<string, unknown>;
  try {
    const uiRes = await fetch(userinfo_endpoint, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    profile = uiRes.ok
      ? (await uiRes.json()) as SessionUser & Record<string, unknown>
      : decodeJwtPayload<SessionUser & Record<string, unknown>>(tokens.id_token);
  } catch {
    profile = decodeJwtPayload<SessionUser & Record<string, unknown>>(tokens.id_token);
  }

  const session: Session = {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token ?? "",
    expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
    idToken: tokens.id_token,
    user: {
      sub: profile.sub,
      name: profile.name,
      preferred_username: profile.preferred_username,
      email: profile.email,
      groups: profile.groups ?? null,
    },
  };

  const sid = await createSession(session);
  return { sid, returnTo: oidcState.returnTo };
}

export async function getValidToken(request: Request): Promise<string | null> {
  const sess = await getSession(request);
  if (!sess) return null;

  const { sid, data } = sess;
  const now = Math.floor(Date.now() / 1000);

  if (data.expiresAt > now + 60) return data.accessToken;

  if (!data.refreshToken) {
    await destroySession(sid);
    return null;
  }

  try {
    const { token_endpoint } = await getDiscovery();
    const res = await fetch(token_endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: data.refreshToken,
      }),
    });

    if (!res.ok) {
      await destroySession(sid);
      return null;
    }

    const tokens = (await res.json()) as TokenResponse;
    await updateSession(sid, {
      ...data,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? data.refreshToken,
      expiresAt: now + tokens.expires_in,
    });
    return tokens.access_token;
  } catch {
    await destroySession(sid);
    return null;
  }
}

export async function buildLogoutUrl(
  idToken: string | undefined,
  request: Request,
): Promise<string> {
  const { end_session_endpoint } = await getDiscovery();
  const origin = process.env.PUBLIC_ORIGIN ?? new URL(request.url).origin;
  const params = new URLSearchParams({ post_logout_redirect_uri: origin });
  if (idToken) params.set("id_token_hint", idToken);
  return `${end_session_endpoint}?${params}`;
}

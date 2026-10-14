import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "session";
export const STATE_COOKIE = "oauth_state";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

function env(name) {
  return process.env[name] ?? import.meta.env[name];
}

export function getConfig() {
  const appUrl = (env("APP_URL") || "http://localhost:4321").replace(/\/$/, "");

  return {
    clientId: env("GOOGLE_CLIENT_ID"),
    clientSecret: env("GOOGLE_CLIENT_SECRET"),
    secret: env("AUTH_SECRET"),
    redirectUri: `${appUrl}/auth/callback`,
    secure: appUrl.startsWith("https://")
  };
}

export function cookieOptions(maxAge) {
  return {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: getConfig().secure,
    maxAge
  };
}

export function randomState() {
  return randomBytes(24).toString("base64url");
}

/*
 * Session = JSON encodé en base64url + signature HMAC-SHA256.
 * Le contenu est lisible mais ne peut pas être modifié sans AUTH_SECRET.
 */

function sign(payload) {
  return createHmac("sha256", getConfig().secret)
    .update(payload)
    .digest("base64url");
}

export function createSession(user) {
  const payload = Buffer.from(
    JSON.stringify({
      ...user,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE
    })
  ).toString("base64url");

  return {
    value: `${payload}.${sign(payload)}`,
    maxAge: SESSION_MAX_AGE
  };
}

export function readSession(token) {
  if (!token || !getConfig().secret) return null;

  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = Buffer.from(sign(payload));
  const received = Buffer.from(signature);

  if (
    expected.length !== received.length ||
    !timingSafeEqual(expected, received)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (data.exp < Date.now() / 1000) return null;

    return {
      name: data.name ?? null,
      email: data.email ?? null,
      image: data.image ?? null
    };
  } catch {
    return null;
  }
}

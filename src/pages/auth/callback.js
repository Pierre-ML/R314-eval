import {
  SESSION_COOKIE,
  STATE_COOKIE,
  cookieOptions,
  createSession,
  getConfig
} from "../../lib/auth.js";

/*
 * Retour de Google : vérifie le state, échange le code contre un
 * access token, récupère le profil puis crée la session.
 */
export async function GET({ url, cookies, redirect }) {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies.get(STATE_COOKIE)?.value;

  cookies.delete(STATE_COOKIE, { path: "/" });

  if (!code || !state || state !== expectedState) {
    return redirect("/login?error=state");
  }

  const { clientId, clientSecret, redirectUri, secret } = getConfig();

  if (!clientId || !clientSecret || !secret) {
    return new Response("Configuration OAuth incomplète dans .env", { status: 500 });
  }

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  if (!tokenResponse.ok) {
    return redirect("/login?error=token");
  }

  const { access_token } = await tokenResponse.json();

  const profileResponse = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    { headers: { Authorization: `Bearer ${access_token}` } }
  );

  if (!profileResponse.ok) {
    return redirect("/login?error=profile");
  }

  const profile = await profileResponse.json();

  const session = createSession({
    name: profile.name,
    email: profile.email,
    image: profile.picture
  });

  cookies.set(SESSION_COOKIE, session.value, cookieOptions(session.maxAge));

  return redirect("/");
}

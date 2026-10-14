import { STATE_COOKIE, cookieOptions, getConfig, randomState } from "../../lib/auth.js";

/*
 * Redirige l'utilisateur vers l'écran de connexion Google.
 */
export function GET({ cookies, redirect }) {
  const { clientId, redirectUri } = getConfig();

  if (!clientId) {
    return new Response("GOOGLE_CLIENT_ID manquant dans .env", { status: 500 });
  }

  const state = randomState();
  cookies.set(STATE_COOKIE, state, cookieOptions(60 * 10));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account"
  });

  return redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

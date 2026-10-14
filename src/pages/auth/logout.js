import { SESSION_COOKIE } from "../../lib/auth.js";

export function GET({ cookies, redirect }) {
  cookies.delete(SESSION_COOKIE, { path: "/" });
  return redirect("/login");
}

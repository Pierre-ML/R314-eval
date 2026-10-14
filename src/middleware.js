import { defineMiddleware } from "astro:middleware";
import { SESSION_COOKIE, readSession } from "./lib/auth.js";

const PUBLIC_PATHS = ["/login", "/auth/"];

export const onRequest = defineMiddleware((context, next) => {
  const user = readSession(context.cookies.get(SESSION_COOKIE)?.value);

  if (user) {
    context.locals.user = user;
  }

  const { pathname } = context.url;
  const isPublic = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  if (!user && !isPublic) {
    return context.redirect("/login");
  }

  return next();
});

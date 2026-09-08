import Fastify from "fastify";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import rateLimit from "@fastify/rate-limit";
import staticFiles from "@fastify/static";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { resolve } from "node:path";

const digest = (value) => createHash("sha256").update(value).digest();
const lifetime = 12 * 60 * 60 * 1000;

export async function createApp({
  production = process.env.NODE_ENV === "production",
  password = process.env.SITE_PASSWORD,
  origin = process.env.APP_ORIGIN,
  root = resolve("dist"),
  now = Date.now,
} = {}) {
  if (production && (!password || password.length < 12)) {
    throw new Error(
      "Production requires SITE_PASSWORD with at least 12 characters.",
    );
  }
  password ??= "oops-all-skin";
  if (!password) throw new Error("SITE_PASSWORD cannot be empty.");
  if (
    production &&
    (!origin ||
      !/^https:\/\//.test(origin) ||
      new URL(origin).origin !== origin)
  ) {
    throw new Error(
      "Production requires APP_ORIGIN as an exact HTTPS origin, without a trailing slash.",
    );
  }
  const app = Fastify({
    logger: false,
    bodyLimit: 4096,
    trustProxy: production ? 1 : false,
  });
  const sessions = new Map();
  const cookieName = production ? "__Host-skin-club" : "skin-club";
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: production,
    sameSite: "strict",
  };
  await app.register(cookie);
  await app.register(formbody);
  await app.register(rateLimit, { global: false });

  const loggedIn = (request) => {
    const token = request.cookies[cookieName];
    const expiry = sessions.get(token);
    if (!expiry || expiry <= now()) {
      sessions.delete(token);
      return false;
    }
    return true;
  };
  app.addHook("onRequest", async (request, reply) => {
    reply.header("Cache-Control", "no-store");
    reply.header("X-Content-Type-Options", "nosniff");
    // Keep same-origin form Origin headers; no-referrer makes Chromium send null.
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-Robots-Tag", "noindex, nofollow");
    reply.header(
      "Content-Security-Policy",
      "default-src 'self'; script-src 'none'; style-src 'self' 'unsafe-inline'; img-src 'self'; font-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
    );
    if (production)
      reply.header("Strict-Transport-Security", "max-age=31536000");
    const path = new URL(request.raw.url, "http://localhost").pathname;
    if (["/health", "/login"].includes(path)) return;
    if (!loggedIn(request)) return reply.redirect("/login");
  });
  const sameOrigin = (request, reply) => {
    const expected = origin ?? `http://${request.headers.host}`;
    if (request.headers.origin !== expected) {
      reply.code(403).send("Please submit this form from the site.");
      return false;
    }
    return true;
  };
  app.get("/health", async () => ({ status: "ok" }));
  app.get("/login", async (request, reply) => {
    if (loggedIn(request)) return reply.redirect("/");
    return reply.type("text/html").send(loginPage(false));
  });
  app.post(
    "/login",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (request, reply) => {
      if (!sameOrigin(request, reply)) return;
      const candidate =
        typeof request.body?.password === "string" ? request.body.password : "";
      if (!timingSafeEqual(digest(candidate), digest(password)))
        return reply.code(401).type("text/html").send(loginPage(true));
      for (const [token, expiry] of sessions)
        if (expiry <= now()) sessions.delete(token);
      if (sessions.size >= 1000) sessions.delete(sessions.keys().next().value);
      sessions.delete(request.cookies[cookieName]);
      const token = randomBytes(32).toString("hex");
      sessions.set(token, now() + lifetime);
      return reply
        .setCookie(cookieName, token, {
          ...cookieOptions,
          maxAge: lifetime / 1000,
        })
        .redirect("/", 303);
    },
  );
  app.post("/logout", async (request, reply) => {
    if (!sameOrigin(request, reply)) return;
    sessions.delete(request.cookies[cookieName]);
    return reply.clearCookie(cookieName, cookieOptions).redirect("/login", 303);
  });
  // Everything in dist, including images, passes the authentication hook.
  await app.register(staticFiles, {
    root,
    index: ["index.html"],
    cacheControl: false,
    dotfiles: "deny",
  });
  app.setNotFoundHandler((_request, reply) =>
    reply
      .code(404)
      .type("text/html")
      .send(
        '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Crumbs.</title><body><h1>Nothing here but crumbs.</h1><p><a href="/">Back to the bucket</a></p></body></html>',
      ),
  );
  return app;
}

function loginPage(error) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="robots" content="noindex,nofollow"><title>The Skin Club — Secret entrance</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;padding:25px;background:repeating-linear-gradient(90deg,#f8f2e6 0 100px,#eee4d3 100px 200px);color:#26231e;font-family:Arial,sans-serif}.card{width:100%;max-width:470px;background:#f8f2e6;border:1px solid #26231e;padding:45px;box-shadow:9px 9px 0 #c51925}.brand{font-size:13px;letter-spacing:2px;font-weight:800}.brand span{background:#c51925;color:#f8f2e6;padding:6px;margin-right:7px}h1{font-family:Impact,'Arial Narrow',sans-serif;font-size:76px;line-height:.95;letter-spacing:-2px;font-weight:900;color:#c51925;margin:38px 0 25px}p{font-size:14px;line-height:1.65}label{display:block;font-size:12px;font-weight:bold;margin:25px 0 10px}input{width:100%;border:1px solid #26231e;background:transparent;border-radius:0;font:inherit;padding:16px}button{border:0;width:100%;padding:18px;background:#c51925;color:#f8f2e6;font-size:14px;font-weight:bold;cursor:pointer;margin-top:16px}button:hover{background:#9d0f1a}:focus-visible{outline:3px solid #2463b3;outline-offset:4px}.fine{font-size:10px;margin-top:28px}.error{color:#a70e19;font-weight:bold}@media(max-width:500px){.card{padding:30px}h1{font-size:64px}}
  </style></head><body><main class="card"><div class="brand"><span>KFC</span> SKIN PILES</div><h1>THIS IS A<br>SKIN-SIDE JOB.</h1><p>The Colonel's most questionable idea is behind this door. Know the secret? You're our kind of people.</p>${error ? '<p class="error" role="alert">Nice try, chicken. That password is not crispy enough.</p>' : ""}<form method="post" action="/login"><label for="password">The secret seasoning</label><input id="password" name="password" type="password" required autocomplete="current-password" maxlength="256"${error ? ' aria-invalid="true"' : ""}><button type="submit">Let me skin ↗</button></form><p class="fine">A private, unofficial KFC parody. No chickens were consulted.</p></main></body></html>`;
}

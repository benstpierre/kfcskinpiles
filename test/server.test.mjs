import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../server/app.mjs";

const origin = "https://skin.example";
const password = "oops-all-skin";
const setup = async (t) => {
  const app = await createApp({ production: true, origin, password });
  t.after(() => app.close());
  return app;
};
const login = (app) =>
  app.inject({
    method: "POST",
    url: "/login",
    headers: { origin },
    payload: { password },
  });
const session = (response) => response.headers["set-cookie"].split(";")[0];

test("production fails closed without required configuration", async () => {
  await assert.rejects(
    createApp({ production: true, password: "", origin }),
    /SITE_PASSWORD/,
  );
  await assert.rejects(
    createApp({ production: true, password, origin: "http://skin.example" }),
    /APP_ORIGIN/,
  );
});
test("pages, assets, encoded paths and the editor stay behind the gate", async (t) => {
  const app = await setup(t);
  for (const url of [
    "/",
    "/index.html",
    "/images/skin-pile.png",
    "/keystatic",
    "/api/keystatic",
    "/%69ndex.html",
    "/anything",
  ]) {
    const response = await app.inject(url);
    assert.equal(response.statusCode, 302, url);
    assert.equal(response.headers.location, "/login");
  }
  const health = await app.inject("/health");
  assert.deepEqual(health.json(), { status: "ok" });
  const page = await app.inject("/login");
  assert.equal(page.statusCode, 200);
  assert.ok(!page.body.includes(password));
  assert.equal(page.headers["cache-control"], "no-store");
  assert.equal(
    page.headers["referrer-policy"],
    "strict-origin-when-cross-origin",
  );
});
test("wrong password, foreign and missing origins are rejected", async (t) => {
  const app = await setup(t);
  const wrong = await app.inject({
    method: "POST",
    url: "/login",
    headers: { origin },
    payload: { password: "chicken" },
  });
  assert.equal(wrong.statusCode, 401);
  assert.equal(wrong.headers["set-cookie"], undefined);
  for (const headers of [{ origin: "https://bad.example" }, {}]) {
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/login",
          headers,
          payload: { password },
        })
      ).statusCode,
      403,
    );
  }
});
test("login protects a real built page and image, with secure session and logout", async (t) => {
  const app = await setup(t);
  const response = await login(app);
  assert.equal(response.statusCode, 303);
  for (const property of [
    "__Host-skin-club=",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    "Path=/",
  ])
    assert.ok(response.headers["set-cookie"].includes(property));
  const headers = { cookie: session(response) };
  const page = await app.inject({ url: "/", headers });
  assert.equal(page.statusCode, 200);
  assert.match(page.body, /ALL SKIN\. NO FILLER\./);
  assert.doesNotMatch(page.body, /<script/);
  assert.equal(
    (await app.inject({ url: "/images/skin-pile.png", headers })).statusCode,
    200,
  );
  assert.equal(
    (await app.inject({ url: "/keystatic", headers })).statusCode,
    404,
  );
  assert.equal(
    (await app.inject({ url: "/api/keystatic", headers })).statusCode,
    404,
  );
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/logout",
        headers: { ...headers, origin: "https://bad.example" },
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/logout",
        headers: { ...headers, origin },
      })
    ).statusCode,
    303,
  );
  assert.equal((await app.inject({ url: "/", headers })).statusCode, 302);
});
test("forged and expired sessions are refused", async (t) => {
  let clock = 1000;
  const app = await createApp({
    production: true,
    origin,
    password,
    now: () => clock,
  });
  t.after(() => app.close());
  assert.equal(
    (
      await app.inject({
        url: "/",
        headers: { cookie: "__Host-skin-club=made-up" },
      })
    ).statusCode,
    302,
  );
  const response = await login(app);
  clock += 12 * 60 * 60 * 1000;
  assert.equal(
    (await app.inject({ url: "/", headers: { cookie: session(response) } }))
      .statusCode,
    302,
  );
});
test("login attempts are bounded", async (t) => {
  const app = await setup(t);
  for (let i = 0; i < 10; i++)
    await app.inject({
      method: "POST",
      url: "/login",
      headers: { origin },
      payload: { password: "wrong" },
    });
  assert.equal((await login(app)).statusCode, 429);
});

// Optional headless browser regression check. Keep separate from the fast local CI gate.
import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { createApp } from "../server/app.mjs";

const app = await createApp({
  production: false,
  password: "oops-all-skin",
  origin: undefined,
});
const address = await app.listen({ host: "127.0.0.1", port: 0 });
let browser;
try {
  browser = await chromium.launch({
    headless: true,
    ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {}),
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await mkdir("output/qa", { recursive: true });
  await page.goto(address);
  await page.getByLabel("The secret seasoning").fill("not-the-password");
  await page.getByRole("button", { name: "Let me skin" }).click();
  assert.ok(await page.getByRole("alert").isVisible());
  await page.getByLabel("The secret seasoning").fill("oops-all-skin");
  await page.getByRole("button", { name: "Let me skin" }).click();
  await page.waitForURL(address + "/");
  assert.equal(
    await page.getByRole("heading", { level: 1 }).innerText(),
    "ALL SKIN. NO FILLER.",
  );
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    await page
      .locator(".hero-art img")
      .evaluate((img) => img.complete && img.naturalWidth > 0),
  );
  for (const [name, width, height] of [
    ["desktop", 1440, 1000],
    ["mobile", 390, 844],
    ["small-mobile", 320, 700],
  ]) {
    await page.setViewportSize({ width, height });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      name + " must not overflow",
    );
    await page.screenshot({
      path: `output/qa/home-${name}.png`,
      fullPage: true,
    });
  }
  await page
    .locator("summary")
    .filter({ hasText: "Can I actually order this?" })
    .click();
  assert.ok(
    await page.getByText("Only in our dreams.", { exact: false }).isVisible(),
  );
  await page.getByRole("button", { name: "Leave the skin club" }).click();
  await page.waitForURL(address + "/login");
  await page.screenshot({ path: "output/qa/login-mobile.png", fullPage: true });
  await page.goto(address + "/images/skin-pile.png");
  await page.waitForURL(address + "/login");
  assert.deepEqual(errors, []);
  console.log(
    "Browser PASS: wrong-password feedback, real form login, rendered assets, 3 viewport sizes, FAQ, logout and protected image. Screenshots: output/qa/",
  );
} finally {
  await browser?.close();
  await app.close();
}

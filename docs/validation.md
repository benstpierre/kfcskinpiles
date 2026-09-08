# Validation record

Prepared on 2026-09-08, on the implementation feature branch. The owner subsequently
authorized deployment to a new Railway project. No database or OpenShell account was
provisioned.

## Passed on the live Railway deployment

- Dedicated project `kfcskinpiles`, service `web`, environment `production`, one replica.
- URL: https://web-production-939f8.up.railway.app
- Deployed application source: `1db8377`.
- Railway deployment: `5f9be7b6-dc65-47a9-922b-f11e88a8fa59`, status `SUCCESS`.
- Railway built the Dockerfile on Linux/amd64 with Node 22 and started the runtime on
  its injected port 8080. Build dependency audits reported no known vulnerabilities.
- At 2026-09-08 21:14 UTC, headless Chromium verified HTTPS health, wrong-password
  feedback, successful form login, a Secure/HttpOnly/SameSite=Strict session cookie,
  loaded hero/fonts, FAQ expansion, logout, and protected-image rejection after logout.
- The live editor and editor API returned 404; foreign-origin logout returned 403.
- Desktop 1440px, phone 390px, and small phone 320px layouts had no horizontal overflow.
  Desktop and phone screenshots were visually inspected. No browser JavaScript errors
  or third-party asset requests were observed.
- Local screenshots: ignored `output/qa/railway/`. No authentication state was saved.

## Passed locally

- Node 22: `npm run verify` — Astro type checks, production build, seven server/policy tests.
- Node 26: initial application checks/build and server tests also passed.
- `npm audit` — zero known vulnerabilities after updating Fastify to 5.12.3.
- `railway.json` validated against Railway's published JSON Schema using the 2020-12 validator.
- Headless Chromium: real browser password submission, wrong-password feedback, logout,
  protected assets, FAQ expansion, and desktop/mobile layout checks. The browser check
  caught and fixed the `Origin: null` issue caused by a `no-referrer` policy.
- Keystatic: opened the form, changed a headline, saved it to `src/content/home.yaml`,
  observed the new heading in the local Astro preview, then restored the original copy.
- Production output contains no Keystatic UI/API and no browser JavaScript; the server
  tests check both the built page and an actual protected image.

Run the fast gate:

```sh
npm ci
npm run verify
```

Optional browser check (separate from the fast gate, not required to edit content):

```sh
npm exec playwright install chromium
npm run build
node scripts/browser-check.mjs
```

The script launches its own temporary loopback visitor server, closes it afterward,
and saves screenshots under ignored `output/qa/`. It can use an already installed
Chromium through `PLAYWRIGHT_EXECUTABLE_PATH`. The implementation used an existing
headless Chromium installation; screenshots were visually inspected.

## Still requires the target environment

- Local Docker execution remains unavailable because the host daemon is stopped;
  remote Docker build/run and live HTTPS behavior are now verified above.
- GitHub CI integration and PR previews are optional and have not been enabled or tested.
- OpenShell gateway acceptance, kernel enforcement probes, actual account login and
  Codex inference: require OpenShell/Docker and the cousin's own account. The candidate
  policy was compared with the v0.0.116 schema/CLI source; local policy tests check
  intended structure, not runtime enforcement. Follow [the acceptance guide](openshell.md).

These boundaries are explicit so a working local demo is not mistaken for a tested live
deployment or a certified sandbox. Neon remains guidance only.

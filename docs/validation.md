# Validation record

Prepared on 2026-09-08, on the implementation feature branch. No live deployment,
purchase, database provisioning, or account login was performed.

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

- Docker image build/run: the host has a Docker CLI but no running daemon. The application
  build, Node 22 runtime behavior, Dockerfile inputs and Railway schema were checked;
  this is not a claim that the container has been executed.
- Railway deployment, generated domain, HTTPS cookie behavior through Railway's proxy,
  CI integration and PR previews: require the owner's account and deployment authorization.
- OpenShell gateway acceptance, kernel enforcement probes, actual account login and
  Codex inference: require OpenShell/Docker and the cousin's own account. The candidate
  policy was compared with the v0.0.116 schema/CLI source; local policy tests check
  intended structure, not runtime enforcement. Follow [the acceptance guide](openshell.md).

These boundaries are explicit so a working local demo is not mistaken for a tested live
deployment or a certified sandbox. Neon remains guidance only.

# Railway runs the site

The live demo is [Skin Piles](https://web-production-939f8.up.railway.app), in the dedicated
`kfcskinpiles` project, `web` service, `production` environment. The initial release used
source commit `1db8377` and passed live HTTPS browser validation on 2026-09-08. It was
uploaded with the CLI; GitHub autodeploys and PR previews are not enabled.

Railway builds the root `Dockerfile` and starts `node server/index.mjs`. Astro creates
the page during the build; Fastify serves it behind the password gate. The production
image contains runtime dependencies and built files, with no CMS editing API or source
credentials. The container runs as an unprivileged user and honors Railway's `PORT`.

## Without GitHub

1. Create your own Railway account and review the current pricing/usage controls.
2. Install the [Railway CLI](https://docs.railway.com/cli), run `railway login`, and
   create a project with `railway init` (or create it in the dashboard and use `railway link`).
3. Add one empty service in that project and link this folder to that service/environment
   using `railway link`. Keep one replica. No database or volume is needed.
4. In the service's Networking settings, generate a Railway domain. Configure the
   runtime variables below before the first successful deployment.
5. Run `npm ci` and `npm run verify` locally, review your content, then run `railway up`
   from the repository root when you intend to publish. It uploads local source;
   `.railwayignore` excludes local auth/config caches and `.env` files.
6. Verify `/health` returns `{"status":"ok"}`, the homepage opens the password screen,
   the selected password opens the content, and logout closes the door again.

These are onboarding instructions for another copy. The demo project, service, domain,
and deployment were created after the owner's explicit deployment authorization.

| Variable | Set it to |
| --- | --- |
| `SITE_PASSWORD` | Your own 12+ character funny passphrase |
| `APP_ORIGIN` | Exact `https://…` public origin, without trailing slash |
| `NODE_ENV` | `production` (also set by the Dockerfile) |
| `PORT` | Leave Railway's injected value alone |

No password is needed at build time. Add it as a Railway runtime variable, not a build
argument, commit, or GitHub Actions secret. `APP_ORIGIN` is used to check form origins,
so update it when changing domains. Use one canonical domain; other origins cannot log in.
If a domain needs an initial deploy before it can be generated in the dashboard, keep
the service unexposed, set the actual domain once available, and redeploy.

`railway.json` selects Dockerfile builds and `/health` as the readiness check. The check
reveals no site content. Keep one replica: password sessions and rate limits live in
memory and reset on deploy/restart. Horizontal scaling would require a shared store.

## Optional GitHub and previews

Connect your own GitHub repository to the Railway service and select the production
branch (`main` after the implementation is reviewed). GitHub Actions runs the included
check/build job; Railway separately builds and hosts the service. Enable **Wait for CI**
on the Railway service to require the successful push workflow before production deployment.
Simply having Actions enabled does not automatically gate Railway.

For PR preview URLs, enable **PR Environments** in Railway Project Settings → Environments.
The base service must have a Railway-provided domain for automatic preview domains.
Railway creates a temporary service/environment on PR open and removes it on PR close
or merge. Branch pushes without a PR don't create PR environments; use a persistent
Railway staging environment connected to a chosen branch if you want that behavior.

Configure a preview password and set the preview's `APP_ORIGIN` to its actual HTTPS
domain before testing login. Do not leave the production origin copied into a preview.
Review copied variables and permissions. Preview environments consume Railway resources;
CI consumes GitHub Actions allowances. Review both accounts' current limits. Railway
restricts PR deploys to permitted project/workspace members with linked GitHub accounts.

The workflow checks PRs and pushes to `main`. If connecting a different persistent
branch and using Wait for CI, add that branch to the workflow's `push.branches` list.
Do not assume production CI-gating behavior establishes a PR-preview gate; verify your
Railway project's preview behavior separately. There are no Railway tokens or deployment
commands in the Actions workflow.

## Local production-recipe check

Railway successfully built and ran the Docker image, including the Node 22 Astro build.
Live HTTPS login and cookies were tested through Railway's proxy. The local implementation
host has no running Docker daemon. To repeat the container build on another machine:

```sh
docker build -t skin-piles .
```

Run the production container (secure production cookies expect HTTPS):

```sh
docker run --rm -p 127.0.0.1:3000:3000 \
  -e NODE_ENV=production -e SITE_PASSWORD \
  -e APP_ORIGIN=https://your-test-domain.example skin-piles
```

Set `SITE_PASSWORD` privately in your host environment first. `/health` can be checked
over localhost HTTP, but verify production login through an HTTPS reverse proxy that
matches `APP_ORIGIN`. Do not weaken cookie settings for Railway. The container above is
production mode; for the easy local HTTP visitor demo, use `npm start` outside Docker.

Sources checked 2026-09-08: [Dockerfile builds](https://docs.railway.com/builds/dockerfiles),
[config as code](https://docs.railway.com/config-as-code/reference),
[CLI uploads](https://docs.railway.com/cli),
[Wait for CI](https://docs.railway.com/deployments/github-autodeploys), and
[Railway environments and PR domains](https://docs.railway.com/environments).

Maintenance note: Railway CLI 5.49.6 now reports that `railway.json` remains supported
until 2026-12-01, after which projects should use `.railway/railway.ts`. The supplied
configuration was accepted for this deployment; migrate it before that cutoff using
Railway's `railway config migrate` workflow.

# KFC Skin Piles

**All skin. No filler.** A lovingly unreasonable, password-protected concept site for
a bucket containing only the crispy skin. It's an unofficial parody, with no ordering,
payments, customer accounts, analytics, or database.

This is also a small playground for someone coming from WordPress: edit the copy in a
browser, preview it on your computer, then publish a built version to Railway.

## See the site in three commands

Install **Node.js 22.12+** (Node 22 LTS recommended), then open a terminal in this folder:

```sh
npm ci
npm run build
npm start
```

Open **http://127.0.0.1:3000**. The local demo password is **`oops-all-skin`**.
No account, GitHub, API key, or database is needed. Stop the server with Ctrl-C.
If port 3000 is busy, run `PORT=3087 npm start` instead (macOS/Linux/WSL).

To choose a different local password, copy `.env.example` to `.env` and edit
`SITE_PASSWORD`. Restart the server after changing it. Never commit `.env`.

## If you know WordPress, you already know the important parts

| WordPress idea | Here |
| --- | --- |
| Dashboard | Keystatic, running on your computer |
| Pages | One Astro homepage, with editable content fields |
| Posts | Not needed for this site; add a collection if you start a blog |
| Media library | Files in `public/images/` |
| Theme | The Astro page and `src/styles/site.css` |
| Plugins | Explicit npm packages, added only when needed |
| Save draft / Preview | Save locally in Keystatic, view the local site |
| Publish | Build and deploy a reviewed version to Railway |
| Hosting | Railway runs the site and password gate |

**Astro is the site builder, not the CMS.** [Keystatic](https://keystatic.com/docs/local-mode)
provides the editing forms and saves normal files. There is no separate CMS server or
database to look after. The tradeoff: this starter's editor runs on your computer, so
you cannot log into the deployed site to edit from any device.

## Change something without touching the layout

```sh
npm run dev
```

Open **http://127.0.0.1:4321/keystatic**, choose **Skin Piles homepage**, and edit
the big headline, introduction, bucket descriptions, or questions. Press **Save**.
Open **http://127.0.0.1:4321** in another tab and refresh to see the result.
The saved content lives in `src/content/home.yaml`, so a normal file backup works too.

Saving is local, not publishing. The editor has no separate draft database or scheduled
publishing. Keep unfinished edits local until you are ready to build and deploy.
The developer preview is deliberately unprotected and binds only to loopback; do not
expose port 4321 to your network or use it as your live server. The build command always
excludes the editor and its write API. The password protects the visitor site, not Keystatic.

Current Astro versions may leave the dev server running in the background. The command
prints its status and URL; use `npm exec astro dev stop` when finished editing.

Try changing “The Personal Pile” to “The Emotional Support Bucket.” Save, refresh, then:

```sh
npm run verify
npm start
```

Restart any already-running visitor server if needed. Visit port 3000 to check the
password-protected result. The verification command checks types, builds the site, and
tests the password/session boundary and policy invariants.

For a new image, put your own file in `public/images/` and update the image reference and
alt text in `src/pages/index.astro`. Keystatic's current form edits text; it does not
include a media uploader. Layout, colours, and the short fixed campaign lines live in
that page and its stylesheet. Make one change at a time and preview it.

## Put it online when you're ready

[Railway setup](docs/railway.md) covers both local uploads and optional GitHub deployment.
The supplied `Dockerfile` builds Astro and runs a small Fastify server on Railway's
injected `PORT`, listening on `0.0.0.0`. Railway runs **one service**, with **one replica**.
It does not need a volume or database. You need your own Railway account and must review
its current plan/costs before deploying. Nothing has been provisioned or deployed for you.

Production requires `SITE_PASSWORD` (12+ characters) and the exact HTTPS `APP_ORIGIN`.
The demo password is public in this README; choose your own funny passphrase before
sharing a live site. The server protects pages **and images**, uses secure HTTP-only
session cookies, limits password attempts, and rejects foreign form submissions.
Sessions expire after 12 hours and reset on restart. This is a small shared-password
club door, not individual accounts or a place for sensitive records.

Keep backups of your source folder. With Git, local commits give you restore points;
GitHub is an optional off-machine copy. Railway's running container is not your source backup.

## GitHub is optional

If you choose GitHub, the included workflow runs checks/builds on pull requests and on
pushes to `main`. GitHub Actions provides **temporary CI machines**; it does not host the
live app or a persistent database. Railway builds and runs the deployed app separately.

For production autodeploys, enable Railway's **Wait for CI** after connecting the repo.
For a temporary preview URL, opt into **Railway PR environments**. A pull request triggers
Railway to create the preview; Actions alone produces no preview URL. Branch-specific
hosting can instead use a separate Railway environment connected to that branch.
[The deployment guide](docs/railway.md#optional-github-and-previews) explains the setup,
preview passwords/origins, permissions, and costs. None is required for local editing.

## Optional: let Codex help inside OpenShell

[The OpenShell guide](docs/openshell.md) supplies a candidate policy, credential-free
image, boundary probes, and the cousin's own interactive ChatGPT device-login flow.
OpenShell enforces restrictions outside Codex, then Codex can run in YOLO mode **inside
that verified boundary**. No API key is required for this proposed account-login flow;
account access and plan limits still apply.

**Status:** documentation/CLI support checked; real OpenShell enforcement and account
login remain unverified because the implementation environment lacks OpenShell and a
running Docker daemon. Complete the guide's acceptance steps before using YOLO. This
does not block building, editing, or hosting the site.

## A database? Later, only if the site needs one

Pages, product copy, FAQs, and images don't need Postgres. This starter has **no active
database dependency, connection string, migration, or provisioned database**.

If you later add persistent signups, saved visitor data, or individual accounts, consider
Neon Postgres at that point. Create a Neon project in your own account, choose a nearby
region, and store its TLS connection string in a server-only Railway `DATABASE_URL`.
Never use a `PUBLIC_` variable or expose it to browser code. Add a Postgres driver,
validated server endpoints, migrations, backups, and appropriate authentication with
the feature that needs them. Use a pooled connection when appropriate for your connection
load; follow [Neon's connection guide](https://neon.com/docs/get-started/connect-neon).

The existing Fastify server can own those future routes. Alternatively, move them into
Astro with its Node adapter and on-demand rendering. Neither is needed today. CI may
test a disposable database in a future workflow; it must not become the persistent
production database.

## What's in the folder

- `src/content/home.yaml` — copy managed by Keystatic.
- `keystatic.config.ts` — the editing form.
- `src/pages/index.astro`, `src/styles/site.css` — page and design.
- `public/images/skin-pile.png` — generated concept photography.
- `server/` — password gate and static serving.
- `Dockerfile`, `railway.json` — Railway build and runtime configuration.
- `openshell/` — optional developer sandbox recipe and policy.
- `test/` — meaningful server and policy checks.

The useful architectural idea from the reference project was a small, self-contained
service with sample content, explicit configuration, and a health endpoint. No private
state or unrelated branding/content was imported. See [assets and credits](docs/assets.md)
and [validation notes](docs/validation.md) for the tested scope.

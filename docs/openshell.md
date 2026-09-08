# Codex gets the playground. You keep the keys.

**Prepared, not yet runtime-certified.** This setup targets OpenShell **v0.0.116** and
Codex CLI **0.153.4**. The policy fields and commands were checked against the tagged
NVIDIA source on 2026-09-08; Codex device login is documented by OpenAI and present in
the local CLI. The implementation machine has no OpenShell CLI or running Docker
daemon, so sandbox creation, kernel enforcement, and your account login have **not**
been exercised. Do not start YOLO until the acceptance steps below pass on your machine.

OpenShell is an optional developer tool. Visitors, the content editor, and Railway do
not need it. NVIDIA still describes this release as alpha. Supported host assumptions:
Apple Silicon macOS with Docker Desktop, or supported Linux with Docker Engine 28+.
Windows/WSL2 is experimental in the tagged support matrix. No GPU is needed here.

## What the boundary means

The [policy](../openshell/policy.yaml) is enforced by OpenShell outside Codex. It allows:

- Editing the disposable `/sandbox` home/project and temporary files.
- Reading the guest operating system and installed tools, while keeping those tools read-only.
- The installed Codex executable reaching `auth.openai.com` and `chatgpt.com` over TLS.
- Node/npm downloading packages from `registry.npmjs.org` with read-only HTTP access.

Other egress is denied. There are no GitHub, Railway, Neon, SSH, or general web grants.
Landlock is a **hard requirement**, and the process runs as a non-root user. If a
required filesystem path or kernel feature is unavailable, startup must fail; do not
switch to `best_effort` to get past it. Keep the host policy outside the uploaded
project, and do not mount your home directory, credential folders, or Docker socket.

This is containment, not perfect judgment: Codex can destroy the sandbox project copy,
read its own login tokens, and transmit project content to the permitted model service.
The account endpoints use TCP passthrough; their request bodies are not restricted by
this policy. Do not place unrelated secrets in the sandbox. `AGENTS.md` instructions
and Codex approval settings alone do not provide this boundary.

## 1. Prepare the tools on your own machine

Follow NVIDIA's [installation guide](https://docs.nvidia.com/openshell/about/installation).
Installation starts a gateway service and creates local configuration; it is more than
a CLI download. Match CLI/gateway **v0.0.116**, run `openshell --version`, and verify
Docker 28+ is running. If the installer supplies another version, review that release's
policy/command changes before using this candidate. Do not install OpenShell in Railway.

The [sandbox image recipe](../openshell/image/Dockerfile) installs Codex from npm without
account state. Its base image tag can receive Node/OS updates; pin a reviewed digest if
you need byte-for-byte reproducibility. No application files or credentials are baked in.

From this repository, on the host:

```sh
openshell sandbox create --name skin-piles --from ./openshell/image \
  --policy ./openshell/policy.yaml --no-auto-providers --detach
openshell policy get skin-piles --full
```

Use an isolated gateway/workspace with **no attached providers or managed inference
route**; `inference.local` is a separate gateway capability, not ordinary network-policy
egress. Verify the full effective policy and sandbox metadata before continuing. Stop if
provider/global-policy additions broaden the grants above. Never accept automatic
discovery of somebody else's local credentials. Never use `--from-existing` credentials.

## 2. Transfer a clean copy, not your home directory

After saving and reviewing a local Git commit, make a credential-free export. No GitHub
account is required to commit locally. Inspect `git ls-files` before exporting; `.gitignore`
does not protect a secret that was already committed. Do not include `.env`, `.codex`,
auth caches, deployment configuration containing secrets, or symlinks to private files.

```sh
skin_export=$(mktemp -d)
mkdir "$skin_export/project"
git archive --output "$skin_export/source.tar" HEAD
tar -xf "$skin_export/source.tar" -C "$skin_export/project"
openshell sandbox upload skin-piles "$skin_export/project" /sandbox
openshell sandbox exec -n skin-piles --tty -- /bin/bash
```

The fresh export's `project` basename is preserved at the `/sandbox` destination.
Confirm `/sandbox/project/package.json` exists inside the sandbox.
Upload finishes before the workload starts; do not combine it with a trailing agent command.

## 3. Prove the boundary before signing in

Inside the sandbox:

```sh
cd /sandbox/project
node openshell/check-boundary.mjs
npm ci
npm run verify
```

The probe checks allowed project writes and npm reads, denied writes outside the
allowlist, absent/inaccessible host control sockets, and denied network requests for
both an unlisted destination and an unapproved binary. A failed curl alone is not proof
of policy enforcement: verify the corresponding **deny decisions in OpenShell logs**,
and verify the allowed npm read succeeded. Confirm the Codex native binary is under
the read-only `/usr/local/lib/node_modules/@openai/codex/` tree matched by the policy.

Gateway validation happens during sandbox creation. `npm test` only checks policy
structure and intended invariants; it is **not** a substitute for these runtime probes.

## 4. Sign in with your own ChatGPT account

In that same sandbox shell:

```sh
unset OPENAI_API_KEY CODEX_API_KEY CODEX_ACCESS_TOKEN
codex -c forced_login_method='"chatgpt"' login --device-auth
codex login status
```

Enable device-code login in your own ChatGPT security settings, or ask your workspace
admin to enable it. Open the URL printed by **your** terminal in your normal browser,
sign in with **your** account, and enter that one-time code. Device login is currently
beta. This is interactive account sign-in, not an API-key billing setup. Included usage,
model availability, and rate limits depend on your account/plan; this is not a promise
of free or unlimited access.

The login cache stays at `/sandbox/.codex`, outside the source export. Never copy another
person's tokens, cookies, or auth files, and never put your login state in images, Git, CI,
or Railway. This direct account login deliberately does not use provider-token injection.

If login is denied by policy, inspect the exact destination and executable in gateway
logs and review the smallest necessary change. If device auth is unavailable for your
account, stop at that blocker. Do not silently switch to API-key billing, broaden the
policy, or copy an existing auth cache. End-to-end account compatibility remains
unverified until login **and a small real Codex request** succeed under this exact policy.

## 5. Only then: YOLO inside OpenShell

Still inside the verified sandbox:

```sh
codex -c forced_login_method='"chatgpt"' --dangerously-bypass-approvals-and-sandbox
```

Ask it to change one line of sample copy and run `npm run verify`. This disables Codex's
own approvals/sandbox; OpenShell remains the outer boundary. Never run that command
on the host as a workaround. The agent cannot publish through the supplied policy.

Review results with `git diff --no-index` against your original copy after downloading
only the project directory to a **new review directory**. Do not export `/sandbox` as a
whole: it contains the account cache. Review any new files for secrets before copying
accepted changes into your real checkout. Run checks there, then publish yourself.
Log out with `codex logout` when finished sharing or retiring that sandbox. Preserve
work before deleting any sandbox; stopping an interactive session is not a backup.

## Authoritative references

- [Tagged OpenShell policy schema](https://github.com/NVIDIA/OpenShell/blob/v0.0.116/docs/reference/policy-schema.mdx)
- [Tagged sandbox commands and file transfer](https://github.com/NVIDIA/OpenShell/blob/v0.0.116/docs/sandboxes/manage-sandboxes.mdx)
- [Tagged platform requirements](https://github.com/NVIDIA/OpenShell/blob/v0.0.116/docs/reference/support-matrix.mdx)
- [Current supported agents: Codex has no default policy coverage](https://docs.nvidia.com/openshell/about/supported-agents)
- [OpenAI account authentication and device-code login](https://developers.openai.com/codex/auth/)

Moving documentation can differ from a tagged binary; retain the version and repeat the
acceptance checks when upgrading.

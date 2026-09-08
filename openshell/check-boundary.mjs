// Run INSIDE the sandbox, before account login or YOLO. This performs no model call.
import { access, writeFile, unlink } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

assert.equal(
  process.platform,
  "linux",
  "Run this in the Linux OpenShell sandbox.",
);
assert.equal(process.env.CODEX_HOME, "/sandbox/.codex");
assert.notEqual(process.getuid(), 0, "Agent must not run as root.");
const probe = "/sandbox/project/.boundary-probe";
await writeFile(probe, "temporary boundary check");
await unlink(probe);
for (const path of ["/root", "/var/run/docker.sock", "/run/docker.sock"]) {
  await assert.rejects(access(path), `${path} must be inaccessible or absent`);
}
// /var/tmp is normally writable by an unprivileged user. Landlock must deny it.
await assert.rejects(
  writeFile("/var/tmp/kfc-boundary-probe", "must not be written"),
  /EACCES|EPERM/,
  "Filesystem policy did not deny /var/tmp",
);
const denied = spawnSync(
  "curl",
  [
    "--connect-timeout",
    "5",
    "--max-time",
    "8",
    "--fail",
    "--silent",
    "https://example.com",
  ],
  { timeout: 10000 },
);
assert.notEqual(denied.status, 0, "Unlisted network destination was reachable");
const binaryDenied = spawnSync(
  "curl",
  [
    "--connect-timeout",
    "5",
    "--max-time",
    "8",
    "--fail",
    "--silent",
    "https://auth.openai.com",
  ],
  { timeout: 10000 },
);
assert.notEqual(
  binaryDenied.status,
  0,
  "curl must not inherit Codex network permission",
);
const npm = spawnSync(
  "npm",
  [
    "view",
    "astro@7.3.2",
    "version",
    "--fetch-retries=0",
    "--fetch-timeout=10000",
  ],
  { encoding: "utf8", timeout: 15000 },
);
assert.equal(
  npm.status,
  0,
  "Allowed npm read failed; inspect gateway denial logs.",
);
assert.equal(npm.stdout.trim(), "7.3.2");
console.log(
  "Filesystem and network probes passed. Inspect corresponding OpenShell deny logs before login. Account access and inference are separate checks.",
);

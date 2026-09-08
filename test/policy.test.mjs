import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

test("candidate policy preserves the intended fail-closed boundary", () => {
  const policy = parse(
    readFileSync(new URL("../openshell/policy.yaml", import.meta.url), "utf8"),
  );
  assert.equal(policy.version, 1);
  assert.equal(policy.landlock.compatibility, "hard_requirement");
  assert.equal(policy.filesystem_policy.include_workdir, false);
  assert.deepEqual(policy.filesystem_policy.read_write, [
    "/sandbox",
    "/tmp",
    "/dev/null",
  ]);
  assert.deepEqual(policy.process, {
    run_as_user: "sandbox",
    run_as_group: "sandbox",
  });
  for (const path of [
    ...policy.filesystem_policy.read_only,
    ...policy.filesystem_policy.read_write,
  ]) {
    assert.ok(
      path.startsWith("/") && !path.split("/").includes("..") && path !== "/",
    );
  }
  const hosts = Object.values(policy.network_policies)
    .flatMap((p) => p.endpoints.map((e) => e.host))
    .sort();
  assert.deepEqual(hosts, [
    "auth.openai.com",
    "chatgpt.com",
    "registry.npmjs.org",
  ]);
  for (const rule of Object.values(policy.network_policies)) {
    for (const endpoint of rule.endpoints) {
      assert.equal(endpoint.port, 443);
      assert.notEqual(endpoint.enforcement, "audit");
      assert.ok(!endpoint.host.includes("*"));
    }
    assert.ok(rule.binaries.every((b) => b.path.startsWith("/usr/local/")));
  }
  assert.equal(
    policy.network_policies.npm_downloads.endpoints[0].access,
    "read-only",
  );
  assert.equal(policy.network_policies.codex_account.binaries.length, 1);
});

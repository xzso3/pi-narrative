import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { buildActorContext, canonizeDraft, validateScene } from "../src/core.js";

const fixture = path.resolve("examples/roadside-station");

test("actor context does not leak future or other-character secrets", () => {
  const context = buildActorContext(fixture, "mara", "fuel-bargain");
  const serialized = JSON.stringify(context);
  assert.match(serialized, /Mara/);
  assert.match(serialized, /bridge-rumor/);
  assert.doesNotMatch(serialized, /underground-reserve/);
  assert.doesNotMatch(serialized, /mara-dies-later/);
});

test("scene validator catches missing cast characters", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-"));
  fs.cpSync(fixture, tmp, { recursive: true });
  const scenePath = path.join(tmp, "narrative/scenes/fuel-bargain.json");
  const scene = JSON.parse(fs.readFileSync(scenePath, "utf8"));
  scene.cast.push("ghost");
  fs.writeFileSync(scenePath, JSON.stringify(scene, null, 2));
  const result = validateScene(tmp, "fuel-bargain");
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((x) => x.includes("ghost")));
});

test("canonization is explicit and refuses overwrite", () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "pi-narrative-"));
  fs.cpSync(fixture, tmp, { recursive: true });
  fs.mkdirSync(path.join(tmp, "narrative/drafts"), { recursive: true });
  fs.copyFileSync(
    path.join(tmp, "narrative/scenes/fuel-bargain.json"),
    path.join(tmp, "narrative/drafts/fuel-bargain.json"),
  );
  const canon = canonizeDraft(tmp, "fuel-bargain", { approvedBy: "test" });
  assert.equal(canon.canon.status, "approved");
  assert.throws(() => canonizeDraft(tmp, "fuel-bargain"), /already exists/);
});


test("unsafe ids are rejected before filesystem access", () => {
  assert.throws(() => buildActorContext(fixture, "../mara", "fuel-bargain"), /Character id/);
  const validation = validateScene(fixture, "../../secret");
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some((error) => error.includes("Scene id")));
});

import fs from "node:fs";
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url)));
const required = ["extensions", "skills"];
for (const key of required) {
  if (!pkg.pi?.[key]?.length) throw new Error(`package.json pi.${key} is missing`);
}
for (const file of [
  "extensions/narrative-runtime.ts",
  "skills/roleplay-actor/SKILL.md",
  "skills/narrative-director/SKILL.md",
  "skills/scene-writer/SKILL.md",
  "skills/narrative-reviewer/SKILL.md",
  "skills/narrative-arbiter/SKILL.md",
  "src/state-engine.js",
  "src/pi-arbiter-runner.ts",
  "src/semantics.js",
  "skills/game-narrative-semantics/SKILL.md",
]) {
  if (!fs.existsSync(new URL(`../${file}`, import.meta.url))) throw new Error(`Missing ${file}`);
}
console.log("Pi package structure OK");

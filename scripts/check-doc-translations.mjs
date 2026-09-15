import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const missing = [];

function expect(relativePath) {
  if (!fs.existsSync(path.join(root, relativePath))) missing.push(relativePath);
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

for (const [source, translation] of [
  ["README.md", "README.zh-CN.md"],
  ["CHANGELOG.md", "CHANGELOG.zh-CN.md"],
  ["CONTRIBUTING.md", "CONTRIBUTING.zh-CN.md"],
  ["examples/unity/README.md", "examples/unity/README.zh-CN.md"],
]) {
  if (fs.existsSync(path.join(root, source))) expect(translation);
}

const docsRoot = path.join(root, "docs");
for (const source of walk(docsRoot)) {
  const rel = path.relative(docsRoot, source).replaceAll(path.sep, "/");
  if (!rel.endsWith(".md") || rel.startsWith("zh-CN/")) continue;
  expect(`docs/zh-CN/${rel}`);
}

const skillsRoot = path.join(root, "skills");
for (const source of walk(skillsRoot)) {
  if (path.basename(source) !== "SKILL.md") continue;
  const skillName = path.basename(path.dirname(source));
  expect(`docs/zh-CN/skills/${skillName}.md`);
}

if (missing.length) {
  console.error("Missing Simplified Chinese documentation mirrors:\n" + missing.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Documentation translation mirrors OK");

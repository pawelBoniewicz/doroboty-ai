import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { verifyPacket } from "./verify-participant.mjs";
const root = process.cwd();
const argument = process.argv[2];
if (!argument || !path.isAbsolute(argument))
  throw new Error("Pass an absolute output directory outside the repository.");
const target = path.resolve(argument);
const relative = path.relative(root, target);
if (
  !(relative === ".." || relative.startsWith(`..${path.sep}`)) ||
  root.startsWith(target + path.sep)
)
  throw new Error("Output must be outside the source repository and not its ancestor.");
if (fs.existsSync(target) && fs.readdirSync(target).length)
  throw new Error("Output directory must be empty; no existing files will be removed.");
verifyPacket(root);
const entries = [
  "src",
  "public",
  "tests",
  "package.json",
  "package-lock.json",
  "index.html",
  "vite.config.ts",
  "tsconfig.json",
  "vitest.config.ts",
  "playwright.config.ts",
  "eslint.config.mjs",
  ".nvmrc",
  ".prettierrc.json",
  ".prettierignore",
  ".gitignore",
  "tokens.css",
  "GUI.md",
  "components.json",
  "AGENTS.md",
  "CLAUDE.md",
  "BRIEF.md",
  "FEATURES.md",
  "TODO.md",
  "README.md",
  "scripts/bootstrap",
  "scripts/verify",
  "scripts/package-participant.mjs",
  "scripts/verify-participant.mjs",
  "docs/architecture.md",
  "docs/design-system",
  "docs/PARTICIPANT_GUIDE.md",
  "docs/SECURITY.md",
  "docs/RELEASE.md",
  "docs/case",
  ".github",
  "netlify.toml",
];
fs.mkdirSync(target, { recursive: true });
for (const entry of entries) {
  const destination = path.join(target, entry);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.cpSync(path.join(root, entry), destination, { recursive: true });
}
const files = {};
function visit(folder, prefix = "") {
  for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) visit(path.join(folder, entry.name), relative + "/");
    else
      files[relative] = createHash("sha256")
        .update(fs.readFileSync(path.join(folder, entry.name)))
        .digest("hex");
  }
}
visit(target);
fs.writeFileSync(
  path.join(target, "participant-manifest.json"),
  JSON.stringify({ version: 1, stage: "baseline", files }, null, 2) + "\n",
);
verifyPacket(target, { pristine: true });
console.log(
  `Baseline participant source package created at ${target}. Git history and instructor materials excluded.`,
);

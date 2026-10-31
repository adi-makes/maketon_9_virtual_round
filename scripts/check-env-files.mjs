import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.info("\n🔍 Scanning repository for duplicate or unauthorized .env files...\n");

const ignoredDirs = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage"
]);

const allowedRootFiles = new Set([
  ".env.example",
  ".env.local"
]);

const disallowedFiles = [];
const flaggedFiles = [];

function scanDirectory(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const fileName = entry.name;
      // Check if file is an .env variant
      if (fileName === ".env" || fileName.startsWith(".env.")) {
        const isRoot = path.dirname(fullPath) === rootDir;

        if (isRoot) {
          if (fileName === ".env") {
            flaggedFiles.push({
              path: relativePath,
              reason: "Root '.env' detected. Ensure credentials are in '.env.local' instead, to prevent accidental git tracking."
            });
          } else if (!allowedRootFiles.has(fileName)) {
            disallowedFiles.push({
              path: relativePath,
              reason: `Disallowed root environment file '${fileName}'. Only '.env.example' and '.env.local' are permitted.`
            });
          }
        } else {
          disallowedFiles.push({
            path: relativePath,
            reason: `Nested environment file detected. All environment files must strictly reside in the repository root.`
          });
        }
      }
    }
  }
}

scanDirectory(rootDir);

let failed = false;

if (flaggedFiles.length > 0) {
  console.warn("⚠️  Warnings:");
  for (const item of flaggedFiles) {
    console.warn(`   - [${item.path}]: ${item.reason}`);
  }
  console.warn("");
}

if (disallowedFiles.length > 0) {
  console.error("❌ Policy Violations Detected:");
  for (const item of disallowedFiles) {
    console.error(`   - [${item.path}]: ${item.reason}`);
  }
  console.error("\nStrict Policy: Only root '.env.example' and root '.env.local' are allowed in this project.");
  console.error("Please delete all nested or disallowed environment files.\n");
  failed = true;
}

if (failed) {
  process.exit(1);
} else {
  console.info("✅ Environment file policy passed: No unauthorized or nested .env files found.\n");
  process.exit(0);
}

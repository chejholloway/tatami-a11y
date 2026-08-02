import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Load environment variables from .env file
const envPath = path.join(rootDir, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && !key.startsWith("#") && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join("=").trim();
    }
  });
}

/**
 * Resolve a Surge deploy URL for a target.
 *
 * This script actually runs `surge`, so an unset env var is a hard failure:
 * falling back to a hardcoded URL here would silently push a deploy toward a
 * domain the current user may not own. Throw loudly instead, naming the exact
 * .env variable to set and what it's for.
 */
function requireSurgeUrl(envVar, label) {
  const url = process.env[envVar];
  if (!url) {
    throw new Error(
      `${label} deploy URL is not set. Add ${envVar} to your .env file ` +
        `(see .env.example), e.g. ${envVar}=https://your-project-name.surge.sh`,
    );
  }
  return url;
}

const target = process.argv[2] || "demo";

if (target === "storybook") {
  const url = requireSurgeUrl("SURGE_STORYBOOK_URL", "Storybook");
  console.log(`Deploying storybook to ${url}...`);
  execSync(`surge storybook-static ${url}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Storybook deployed successfully");
} else if (target === "docs") {
  const url = requireSurgeUrl("SURGE_DOCS_URL", "Docs");
  console.log(`Deploying docs to ${url}...`);
  execSync(`surge docs/api ${url}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Docs deployed successfully");
} else if (target === "astro") {
  const url = requireSurgeUrl("SURGE_ASTRO_URL", "Astro demo");
  console.log(`Deploying astro demo to ${url}...`);
  execSync(`surge astro-demo/dist ${url}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Astro demo deployed successfully");
} else {
  const url = requireSurgeUrl("SURGE_DEMO_URL", "Demo");
  console.log(`Deploying demo to ${url}...`);
  execSync(`surge surge ${url}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Demo deployed successfully");
}

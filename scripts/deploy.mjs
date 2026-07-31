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

const SURGE_DEMO_URL = process.env.SURGE_DEMO_URL || "tatami-a11y-demo.surge.sh";
const SURGE_STORYBOOK_URL = process.env.SURGE_STORYBOOK_URL || "tatami-a11y-storybook.surge.sh";
const SURGE_DOCS_URL = process.env.SURGE_DOCS_URL || "tatami-a11y-docs.surge.sh";

const target = process.argv[2] || "demo";

if (target === "storybook") {
  console.log(`Deploying storybook to ${SURGE_STORYBOOK_URL}...`);
  execSync(`surge storybook-static ${SURGE_STORYBOOK_URL}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Storybook deployed successfully");
} else if (target === "docs") {
  console.log(`Deploying docs to ${SURGE_DOCS_URL}...`);
  execSync(`surge docs/api ${SURGE_DOCS_URL}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Docs deployed successfully");
} else {
  console.log(`Deploying demo to ${SURGE_DEMO_URL}...`);
  execSync(`surge surge ${SURGE_DEMO_URL}`, { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Demo deployed successfully");
}

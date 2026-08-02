import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

const target = process.argv[2] || "demo";

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

const PLACEHOLDER_URL = "https://your-project-name.surge.sh";

/**
 * Resolve a Surge deploy URL for a build target.
 *
 * This script runs in CI via `pnpm run build` where no .env exists, so it
 * must not fail when an env var is missing. Instead it falls back to an
 * obviously generic placeholder that would visibly fail if someone tried to
 * deploy with it unchanged — never a real, maintainer-owned subdomain.
 */
function resolveSurgeUrl(envVar, label) {
  const url = process.env[envVar];
  if (!url) {
    console.warn(
      `⚠ ${label} URL (${envVar}) not set — using placeholder ${PLACEHOLDER_URL}. ` +
        `Set ${envVar} in .env (see .env.example) before deploying.`,
    );
    return PLACEHOLDER_URL;
  }
  return url;
}

console.log(`Building for target: ${target}`);

if (target === "storybook") {
  // Build Storybook
  const url = resolveSurgeUrl("SURGE_STORYBOOK_URL", "Storybook");
  console.log("Building Storybook...");
  execSync("pnpm run build-storybook", { cwd: rootDir, stdio: "inherit" });
  console.log("✓ Storybook built successfully");
  console.log(`Deploy to: surge storybook-static ${url}`);
} else if (target === "docs") {
  // Build API documentation (TypeDoc only, not Docusaurus)
  const url = resolveSurgeUrl("SURGE_DOCS_URL", "API docs");
  console.log("Building API documentation...");
  execSync("pnpm run doc:api", { cwd: rootDir, stdio: "inherit" });
  console.log("✓ API documentation built successfully");
  console.log(`Deploy to: surge docs/api ${url}`);
} else if (target === "astro") {
  // Build the Astro demo (islands page exercising all four framework paths)
  const url = resolveSurgeUrl("SURGE_ASTRO_URL", "Astro demo");
  console.log("Building Astro demo...");
  execSync("pnpm run build", { cwd: path.join(rootDir, "astro-demo"), stdio: "inherit" });
  console.log("✓ Astro demo built successfully");
  console.log(`Deploy to: surge astro-demo/dist ${url}`);
} else {
  // Build demo (original behavior)
  const url = resolveSurgeUrl("SURGE_DEMO_URL", "Demo");
  const surgeDir = path.join(rootDir, "surge");
  const distDir = path.join(rootDir, "dist");
  const demoDir = path.join(rootDir, "demo");

  // Create surge directory if it doesn't exist
  if (!fs.existsSync(surgeDir)) {
    fs.mkdirSync(surgeDir, { recursive: true });
  }

  // Copy dist/index.js to surge/index.js
  const distIndexPath = path.join(distDir, "index.js");
  const surgeIndexPath = path.join(surgeDir, "index.js");
  if (fs.existsSync(distIndexPath)) {
    fs.copyFileSync(distIndexPath, surgeIndexPath);
    console.log("✓ Copied dist/index.js to surge/index.js");
  } else {
    console.warn("⚠ dist/index.js not found, skipping");
  }

  // Copy demo/favicon.ico to surge/favicon.ico
  const icoPath = path.join(demoDir, "favicon.ico");
  const surgeIcoPath = path.join(surgeDir, "favicon.ico");
  if (fs.existsSync(icoPath)) {
    fs.copyFileSync(icoPath, surgeIcoPath);
    console.log("✓ Copied demo/favicon.ico to surge/favicon.ico");
  } else {
    console.warn("⚠ demo/favicon.ico not found, skipping");
  }

  // Copy demo/style-modern.css to surge/style-modern.css
  const cssPath = path.join(demoDir, "style-modern.css");
  const surgeCssPath = path.join(surgeDir, "style-modern.css");
  if (fs.existsSync(cssPath)) {
    fs.copyFileSync(cssPath, surgeCssPath);
    console.log("✓ Copied demo/style-modern.css to surge/style-modern.css");
  } else {
    console.warn("⚠ demo/style-modern.css not found, skipping");
  }

  // Copy demo/index.html to surge/index.html and fix paths
  const demoHtmlPath = path.join(demoDir, "index.html");
  const surgeHtmlPath = path.join(surgeDir, "index.html");
  if (fs.existsSync(demoHtmlPath)) {
    let htmlContent = fs.readFileSync(demoHtmlPath, "utf-8");
    htmlContent = htmlContent.replace(/'\.\.\/dist\/index\.js'/g, "'./index.js'");
    fs.writeFileSync(surgeHtmlPath, htmlContent);
    console.log("✓ Copied demo/index.html to surge/index.html (fixed paths)");
  } else {
    console.warn("⚠ demo/index.html not found, skipping");
  }

  console.log("✓ Surge folder ready for deployment");
  console.log(`Deploy to: surge surge ${url}`);
}

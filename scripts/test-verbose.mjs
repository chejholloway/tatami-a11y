import { execSync } from "child_process";
import fs from "fs";

// Remove existing file if it exists
if (fs.existsSync("failing-tests.md")) {
  fs.unlinkSync("failing-tests.md");
}

try {
  const output = execSync("vitest run --reporter=verbose --config vitest.config.mjs", {
    encoding: "utf8",
    stdio: "pipe",
  });

  console.log(output);
  fs.writeFileSync("failing-tests.md", output);
  process.exit(0);
} catch (error) {
  const output = error.stdout + error.stderr;
  console.log(output);
  fs.writeFileSync("failing-tests.md", output);
  process.exit(error.status || 1);
}

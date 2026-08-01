const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const BASE = 'C:/Users/cheho/Downloads/Projects/tatami-a11y/framework-interop-check';
const PORTS = { react: 5173, vue: 5174, svelte: 5175 };

async function startServer(appDir, port) {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['http-server', 'dist', '-p', String(port), '--cors', '-c-1'], {
      cwd: appDir,
      stdio: 'pipe',
      shell: true,
    });
    let resolved = false;
    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        reject(new Error('Server startup timeout'));
      }
    }, 15000);
    server.stdout.on('data', (data) => {
      if (!resolved && data.toString().includes('http')) {
        resolved = true;
        clearTimeout(timer);
        resolve(server);
      }
    });
    server.stderr.on('data', (data) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        reject(new Error(data.toString()));
      }
    });
  });
}

async function runTests() {
  const browser = await chromium.launch();
  const results = {};

  for (const [framework, port] of Object.entries(PORTS)) {
    console.log(`\n=== Testing ${framework} app ===`);
    const appDir = path.join(BASE, `${framework}-app`);
    let server;
    try {
      server = await startServer(appDir, port);
      console.log(`  Server started on port ${port}`);
    } catch (e) {
      console.log(`  Failed to start ${framework} server: ${e.message}`);
      results[framework] = { error: e.message };
      continue;
    }

    const page = await browser.newPage();
    await page.goto(`http://localhost:${port}/`);
    try {
      await page.waitForLoadState('networkidle');
    } catch {
      await page.waitForTimeout(2000);
    }

    const frameworkResults = {};

    // Toast naive: first "Show Toast" button, first "Re-render" button
    try {
      const showToastBtns = page.locator('button:has-text("Show Toast")');
      const rerenderBtns = page.locator('button:has-text("Re-render")');
      const count = await showToastBtns.count();
      console.log(`  Found ${count} "Show Toast" buttons`);
      if (count > 0) {
        await showToastBtns.first().click();
        await rerenderBtns.first().click();
        await page.waitForTimeout(300);
        const sections = await page.locator('.test-section').all();
        if (sections.length > 0) {
          const resultText = await sections[0].locator('.result').textContent();
          frameworkResults.toastNaive = resultText?.trim() || 'No result';
        }
      }
    } catch (e) {
      frameworkResults.toastNaive = `ERROR: ${e.message}`;
    }

    // Toast wrapper: second "Show Toast" button, second "Re-render" button
    try {
      const showToastBtns = page.locator('button:has-text("Show Toast")');
      const rerenderBtns = page.locator('button:has-text("Re-render")');
      const showCount = await showToastBtns.count();
      const rerenderCount = await rerenderBtns.count();
      if (showCount > 1 && rerenderCount > 1) {
        await showToastBtns.nth(1).click();
        await rerenderBtns.nth(1).click();
        await page.waitForTimeout(300);
        const sections = await page.locator('.test-section').all();
        if (sections.length > 1) {
          const resultText = await sections[1].locator('.result').textContent();
          frameworkResults.toastWrapper = resultText?.trim() || 'No result';
        }
      }
    } catch (e) {
      frameworkResults.toastWrapper = `ERROR: ${e.message}`;
    }

    // Dropdown naive: first "Open Dropdown" button, first "Re-render" button for dropdown
    try {
      const openDropdownBtns = page.locator('button:has-text("Open Dropdown")');
      const rerenderBtns = page.locator('button:has-text("Re-render")');
      const openCount = await openDropdownBtns.count();
      const rerenderCount = await rerenderBtns.count();
      if (openCount > 0 && rerenderCount > 1) {
        await openDropdownBtns.first().click();
        await rerenderBtns.nth(2).click();
        await page.waitForTimeout(300);
        const sections = await page.locator('.test-section').all();
        if (sections.length > 2) {
          const resultText = await sections[2].locator('.result').textContent();
          frameworkResults.dropdownNaive = resultText?.trim() || 'No result';
        }
      }
    } catch (e) {
      frameworkResults.dropdownNaive = `ERROR: ${e.message}`;
    }

    // Dropdown wrapper: second "Open Dropdown" button, last "Re-render" button
    try {
      const openDropdownBtns = page.locator('button:has-text("Open Dropdown")');
      const rerenderBtns = page.locator('button:has-text("Re-render")');
      const openCount = await openDropdownBtns.count();
      const rerenderCount = await rerenderBtns.count();
      if (openCount > 1 && rerenderCount > 3) {
        await openDropdownBtns.nth(1).click();
        await rerenderBtns.last().click();
        await page.waitForTimeout(300);
        const sections = await page.locator('.test-section').all();
        if (sections.length > 3) {
          const resultText = await sections[3].locator('.result').textContent();
          frameworkResults.dropdownWrapper = resultText?.trim() || 'No result';
        }
      }
    } catch (e) {
      frameworkResults.dropdownWrapper = `ERROR: ${e.message}`;
    }

    results[framework] = frameworkResults;
    await page.close();
    server.kill();
  }

  await browser.close();
  return results;
}

runTests().then((results) => {
  console.log('\n=== FINAL RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  const outputPath = path.join(BASE, 'test-results.json');
  require('fs').writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Results saved to ${outputPath}`);
}).catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
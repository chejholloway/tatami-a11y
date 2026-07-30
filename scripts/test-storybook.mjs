import { spawn, execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const testScript = args.includes('--verbose') ? 'test-storybook:run-verbose' : 'test-storybook:run';

let storybookProc = null;

function log(prefix, msg) {
  process.stdout.write(`[${prefix}] ${msg}\n`);
}

function killProcessOnPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      timeout: 5000,
    });
    const pids = new Set();
    for (const line of result.trim().split('\n')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore', timeout: 3000 });
        log('cleanup', `Killed process ${pid} on port ${port}`);
      } catch { }
    }
  } catch { }
}

function cleanup() {
  if (storybookProc && !storybookProc.killed) {
    try {
      const pid = storybookProc.pid;
      execSync(`taskkill /T /F /PID ${pid}`, { stdio: 'ignore', timeout: 3000 });
    } catch { }
    storybookProc.kill();
  }
}

process.on('SIGINT', () => { cleanup(); process.exit(1); });
process.on('SIGTERM', () => { cleanup(); process.exit(1); });
process.on('exit', cleanup);

async function startStorybook() {
  return new Promise((resolve, reject) => {
    killProcessOnPort(6006);

    const proc = spawn('pnpm storybook', {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });
    storybookProc = proc;

    const timeout = setTimeout(() => {
      reject(new Error('Timed out waiting for Storybook to start'));
    }, 120_000);

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(text);
      if (text.includes('started')) {
        clearTimeout(timeout);
        resolve(proc);
      }
    });

    proc.stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });

    proc.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    proc.on('exit', (code) => {
      clearTimeout(timeout);
      reject(new Error(`Storybook exited with code ${code} before starting`));
    });
  });
}

async function runTests(proc) {
  return new Promise((resolve, reject) => {
    const testProc = spawn(`pnpm ${testScript}`, {
      cwd: root,
      stdio: 'inherit',
      shell: true,
    });

    testProc.on('exit', (code) => {
      cleanup();
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Tests failed with exit code ${code}`));
      }
    });

    testProc.on('error', reject);
  });
}

try {
  log('sb', 'Starting Storybook...');
  const proc = await startStorybook();
  log('sb', 'Storybook ready. Running a11y tests...');

  await runTests(proc);
  log('test', 'All accessibility tests passed!');
  process.exit(0);
} catch (err) {
  log('sb', err.message);
  process.exit(1);
}

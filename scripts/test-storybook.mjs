import { spawn } from 'child_process';

const args = process.argv.slice(2);
const testProc = spawn('pnpm test-storybook:run', args, {
  stdio: 'inherit',
  shell: true,
});

testProc.on('exit', (code) => {
  process.exit(code ?? 1);
});

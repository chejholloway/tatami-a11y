import { defineConfig } from 'rolldown';

export default defineConfig({
  input: 'src/index.ts',
  output: {
    dir: 'dist',
    format: 'esm',
  },
  platform: 'node',
  external: [], // Nothing external for a library
});

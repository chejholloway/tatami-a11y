import type { Preview } from '@storybook/html-vite';
import '../demo/style-modern.css';

// Load the library globally
import * as TatamiA11y from '../dist/index.mjs';

// Make it available globally for stories
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).TatamiA11y = TatamiA11y;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
};

export default preview;

import type { Preview } from '@storybook/html';
import '../demo/style-modern.css';

// Load the library globally
import * as TatamiA11y from '../dist/index.mjs';

// Make it available globally for stories
if (typeof window !== 'undefined') {
  (window as any).TatamiA11y = TatamiA11y;
}

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;

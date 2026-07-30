import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Toast',
  render: () => `
    <p>Click a button to show a toast notification. Toasts auto-dismiss. Press <kbd>Alt+T</kbd> to jump to toasts.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-info" id="toast-info-btn">Info</button>
      <button class="btn-success" id="toast-success-btn">Success</button>
      <button class="btn-danger" id="toast-error-btn">Error</button>
      <button class="btn-warning" id="toast-warning-btn">Warning</button>
      <button class="btn-secondary" id="toast-dismiss-all-btn">Dismiss All</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

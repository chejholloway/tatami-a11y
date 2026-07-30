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

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.js');
    const Toast = module.Toast;
    
    const infoBtn = canvasElement.querySelector('#toast-info-btn') as HTMLButtonElement;
    const successBtn = canvasElement.querySelector('#toast-success-btn') as HTMLButtonElement;
    const errorBtn = canvasElement.querySelector('#toast-error-btn') as HTMLButtonElement;
    const warningBtn = canvasElement.querySelector('#toast-warning-btn') as HTMLButtonElement;
    const dismissAllBtn = canvasElement.querySelector('#toast-dismiss-all-btn') as HTMLButtonElement;
    
    if (infoBtn && Toast) {
      infoBtn.addEventListener('click', () => {
        Toast.info('Info message');
      });
    }
    if (successBtn && Toast) {
      successBtn.addEventListener('click', () => {
        Toast.success('Success message');
      });
    }
    if (errorBtn && Toast) {
      errorBtn.addEventListener('click', () => {
        Toast.error('Error message');
      });
    }
    if (warningBtn && Toast) {
      warningBtn.addEventListener('click', () => {
        Toast.warning('Warning message');
      });
    }
    if (dismissAllBtn && Toast) {
      dismissAllBtn.addEventListener('click', () => {
        Toast.dismissAll();
      });
    }
  },
};

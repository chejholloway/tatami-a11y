import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Dialog',
  render: () => `
    <button class="btn-primary" id="dialog-trigger">Open Non-Modal Dialog</button>
    <div id="dialog-content" class="dialog-demo" style="display:none;">
      <h3>Floating Panel</h3>
      <p>This is a non-modal dialog. It does not trap focus — you can tab freely.</p>
      <button class="btn-secondary" style="margin-top:0.5rem;" id="dialog-close-btn">Close me</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.mjs');
    const Dialog = module.Dialog;
    
    const trigger = canvasElement.querySelector('#dialog-trigger') as HTMLButtonElement;
    const content = canvasElement.querySelector('#dialog-content') as HTMLElement;
    const closeBtn = canvasElement.querySelector('#dialog-close-btn') as HTMLButtonElement;
    if (trigger && content && closeBtn && Dialog) {
      new Dialog({
        trigger,
        dialog: content,
      });
    }
  },
};

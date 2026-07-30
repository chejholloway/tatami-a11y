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

export const Default: StoryObj = {};

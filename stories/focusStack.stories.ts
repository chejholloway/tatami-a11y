import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'FocusStack',
  render: () => `
    <p>Focus restoration for transient UI. Click "Enter Focus Stack" then "Exit Focus Stack" to test.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="focus-trigger">Enter Focus Stack</button>
      <button class="btn-danger" id="exit-focus-stack-btn">Exit Focus Stack</button>
      <button class="btn-secondary" id="clear-focus-stack-btn">Clear Stack</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

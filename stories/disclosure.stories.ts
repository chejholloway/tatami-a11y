import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Disclosure',
  render: () => `
    <button class="disclosure-trigger-demo" id="disclosure-trigger">Toggle Advanced Settings</button>
    <div id="disclosure-content" class="disclosure-content-demo" style="display:none;">
      <p style="margin-bottom:.5rem;">Here are some advanced settings you can configure.</p>
      <label><input type="checkbox"> Enable turbo mode</label>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

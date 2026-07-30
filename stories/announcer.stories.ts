import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Announcer',
  render: () => `
    <p>Screen reader announcements using ARIA live regions.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="announce-polite-btn">Announce (Polite)</button>
      <button class="btn-danger" id="announce-urgent-btn">Announce (Urgent)</button>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

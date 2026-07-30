import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'DatePicker',
  render: () => `
    <div class="datepicker-wrapper">
      <input type="text" id="dp-input" class="datepicker-input" placeholder="YYYY-MM-DD" autocomplete="off" readonly>
      <button id="dp-toggle" class="datepicker-toggle" type="button" aria-label="Choose date">📅</button>
      <div id="dp-dialog" class="datepicker-dialog">
        <div class="datepicker-nav">
          <button id="dp-prev" type="button">◀</button>
          <div id="dp-month-label" class="datepicker-month-label"></div>
          <button id="dp-next" type="button">▶</button>
        </div>
        <div id="dp-grid" class="datepicker-grid"></div>
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

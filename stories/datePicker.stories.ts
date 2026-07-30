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

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.js');
    const DatePicker = module.DatePicker;
    
    const input = canvasElement.querySelector('#dp-input') as HTMLInputElement;
    const toggle = canvasElement.querySelector('#dp-toggle') as HTMLButtonElement;
    const dialog = canvasElement.querySelector('#dp-dialog') as HTMLElement;
    const prevBtn = canvasElement.querySelector('#dp-prev') as HTMLButtonElement;
    const nextBtn = canvasElement.querySelector('#dp-next') as HTMLButtonElement;
    const monthLabel = canvasElement.querySelector('#dp-month-label') as HTMLElement;
    const grid = canvasElement.querySelector('#dp-grid') as HTMLElement;
    
    if (input && toggle && dialog && prevBtn && nextBtn && monthLabel && grid && DatePicker) {
      new DatePicker({
        input,
        toggleButton: toggle,
        dialog,
        monthYearLabel: monthLabel,
        prevMonthButton: prevBtn,
        nextMonthButton: nextBtn,
        calendarGrid: grid,
      });
    }
  },
};

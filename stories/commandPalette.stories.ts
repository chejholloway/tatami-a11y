import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'CommandPalette',
  render: () => `
    <p>Press <kbd>Ctrl+K</kbd> (or <kbd>Cmd+K</kbd>) to open the command palette, or click the button below.</p>
    <div class="controls" style="margin-top: 0.5rem;">
      <button class="btn-primary" id="cmd-open-btn">Open Palette <kbd
          style="opacity:.7;font-size:.8em">Ctrl+K</kbd></button>
    </div>
    <div id="cmd-overlay" class="cmd-palette-overlay" role="presentation">
      <div id="cmd-dialog" class="cmd-palette-dialog">
        <div class="cmd-palette-input-wrap">
          <span class="cmd-palette-search-icon" aria-hidden="true">🔍</span>
          <input type="text" id="cmd-input" class="cmd-palette-input" placeholder="Type a command…" autocomplete="off" spellcheck="false">
        </div>
        <div id="cmd-status" class="cmd-palette-status"></div>
        <div id="cmd-listbox" class="cmd-palette-listbox"></div>
        <div class="cmd-palette-footer">
          <span><kbd>↑↓</kbd> navigate</span>
          <span><kbd>↵</kbd> select</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>
    </div>
    <div id="cmd-backdrop" style="display:none;position:fixed;inset:0;z-index:999;" aria-hidden="true"></div>
  `,
};

export default meta;

export const Default: StoryObj = {
  play: async ({ canvasElement }) => {
    const module = await import('../dist/index.js');
    const CommandPalette = module.CommandPalette;
    
    const openBtn = canvasElement.querySelector('#cmd-open-btn') as HTMLButtonElement;
    const overlay = canvasElement.querySelector('#cmd-overlay') as HTMLElement;
    const dialog = canvasElement.querySelector('#cmd-dialog') as HTMLElement;
    const input = canvasElement.querySelector('#cmd-input') as HTMLInputElement;
    const listbox = canvasElement.querySelector('#cmd-listbox') as HTMLElement;
    const status = canvasElement.querySelector('#cmd-status') as HTMLElement;
    const backdrop = canvasElement.querySelector('#cmd-backdrop') as HTMLElement;
    
    if (overlay && dialog && input && listbox && status && backdrop && CommandPalette) {
      const palette = new CommandPalette({
        overlay,
        dialog,
        input,
        listbox,
        statusRegion: status,
        backdrop,
        commands: [
          { id: '1', label: 'New File', action: () => console.log('New File') },
          { id: '2', label: 'Open File', action: () => console.log('Open File') },
          { id: '3', label: 'Save', action: () => console.log('Save') },
          { id: '4', label: 'Settings', action: () => console.log('Settings') },
        ],
      });
      
      // Add click handler to open button
      if (openBtn) {
        openBtn.addEventListener('click', () => palette.open());
      }
    }
  },
};

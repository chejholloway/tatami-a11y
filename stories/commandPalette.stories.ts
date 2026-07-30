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

export const Default: StoryObj = {};

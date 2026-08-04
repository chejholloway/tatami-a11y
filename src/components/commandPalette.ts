/**
 * Accessible Command Palette Component
 *
 * The "Ctrl+K" pattern (VS Code, GitHub, Linear) is a trap because it looks
 * simple — just a search input with results — but the a11y is genuinely hard:
 *
 *   - Focus must be trapped inside while open, restored on close
 *   - aria-activedescendant must point at the highlighted result so screen
 *     readers announce "3 of 12, Copy file path" without moving DOM focus
 *   - The result count needs a live region so "12 results" announces as you type
 *   - Groups of results (e.g. "Files", "Actions") need role="group" with aria-label
 *   - The input needs aria-controls pointing at the listbox AND aria-expanded
 *   - Backdrop click / Escape must close cleanly and restore focus
 *   - Keyboard: ArrowDown/Up through results, Enter to execute, Escape to cancel
 *
 * WAI-ARIA pattern used: Combobox → Listbox
 *   https://www.w3.org/WAI/ARIA/apg/patterns/combobox/
 *
 * With the added overlay/dialog wrapper (focus trap) from:
 *   https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import { activateFocusTrap, deactivateFocusTrap } from "../shared/focusTrap.js";
import { pushFocusStack, popFocusStack, setInitialFocusReference } from "../shared/focusStack.js";
import { announce } from "../shared/announcer.js";
import { checkReducedMotion } from "../shared/reducedMotion.js";

// ─── Types ───────────────────────────────────────────────────────────────────

/**
 * A single command item in the {@link CommandPalette}.
 */
export interface CommandItem {
  /**
   * Unique identifier for this command.
   */
  id: string;
  /**
   * Primary display text for the command.
   */
  label: string;
  /**
   * Optional secondary text shown below the label.
   */
  description?: string;
  /**
   * Optional group name — items with the same group are visually and semantically grouped.
   */
  group?: string;
  /**
   * Optional keyboard shortcut hint (display only, not functional).
   */
  shortcut?: string;
  /**
   * The action to run when this command is selected.
   */
  action: () => void;
}

/**
 * Options for configuring the {@link CommandPalette} component.
 */
export interface CommandPaletteOptions {
  /** The full-screen overlay (or modal backdrop container). */
  overlay: HTMLElement;
  /** The inner dialog box that contains the input and results. */
  dialog: HTMLElement;
  /** The search input element. */
  input: HTMLInputElement;
  /** The listbox element that receives rendered command items. */
  listbox: HTMLElement;
  /** Element where "N results" live region text renders. */
  statusRegion: HTMLElement;
  /** Optional backdrop element — clicking it closes the palette. */
  backdrop?: HTMLElement;
  /** The initial full list of commands. */
  commands?: CommandItem[];
  /**
   * Custom filter function.
   *
   * @param item - The command item to evaluate
   * @param query - The current search query
   * @returns Whether the command matches the query
   * @default Case-insensitive match on label and description
   */
  filter?: (item: CommandItem, query: string) => boolean;
  /** Called when a command is selected. */
  onSelect?: (item: CommandItem) => void;
  /** Called when the palette opens. */
  onOpen?: () => void;
  /** Called when the palette closes. */
  onClose?: () => void;
  /**
   * Keyboard shortcut that opens the palette.
   * The meta/ctrl key is always required. Defaults to `'k'` (Ctrl+K / Cmd+K).
   */
  hotkey?: string;
}

// ─── CommandPalette class ─────────────────────────────────────────────────────

/**
 * An accessible command palette (Ctrl+K) overlay component.
 *
 * Implements the WAI-ARIA combobox pattern for the search input and the
 * dialog-modal pattern for the overlay. Features focus trapping, result
 * grouping, keyboard navigation (Arrow keys, Enter, Escape), and live-region
 * announcements for filtered result counts and selections.
 *
 * @example
 * ```typescript
 * const palette = new CommandPalette({
 *   overlay: document.getElementById('cmd-overlay'),
 *   dialog: document.getElementById('cmd-dialog'),
 *   input: document.getElementById('cmd-input'),
 *   listbox: document.getElementById('cmd-listbox'),
 *   statusRegion: document.getElementById('cmd-status'),
 * });
 * ```
 */
export class CommandPalette {
  private overlay: HTMLElement;
  private dialog: HTMLElement;
  private input: HTMLInputElement;
  private listbox: HTMLElement;
  private statusRegion: HTMLElement;
  private backdrop?: HTMLElement;
  private commands: CommandItem[];
  private filter: (item: CommandItem, query: string) => boolean;
  private onSelect?: (item: CommandItem) => void;
  private onOpen?: () => void;
  private onClose?: () => void;
  private hotkey: string;

  // Runtime state
  private isOpen: boolean = false;
  private filteredItems: CommandItem[] = [];
  private activeIndex: number = -1;
  // id → element map so we can update aria-activedescendant cheaply
  private itemElements = new Map<string, HTMLElement>();

  // Bound handlers
  private inputInputHandler = () => this.handleInput();
  private inputKeydownHandler = (e: KeyboardEvent) => this.handleInputKeyDown(e);
  private listboxClickHandler = (e: MouseEvent) => this.handleListboxClick(e);
  private backdropClickHandler = () => this.close();
  private overlayClickHandler = (e: MouseEvent) => {
    if (e.target === this.overlay) this.close();
  };
  private globalKeydownHandler = (e: KeyboardEvent) => this.handleGlobalKeyDown(e);

  /**
   * @param options - Configuration options for the command palette
   */
  constructor(options: CommandPaletteOptions) {
    this.overlay = options.overlay;
    this.dialog = options.dialog;
    this.input = options.input;
    this.listbox = options.listbox;
    this.statusRegion = options.statusRegion;
    this.backdrop = options.backdrop;
    this.commands = options.commands ?? [];
    this.hotkey = options.hotkey ?? "k";
    this.onSelect = options.onSelect;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;
    this.filter =
      options.filter ??
      ((item, q) => {
        const query = q.toLowerCase();
        return (
          item.label.toLowerCase().includes(query) ||
          (item.description?.toLowerCase().includes(query) ?? false)
        );
      });

    this.init();
  }

  // ─── Setup ─────────────────────────────────────────────────────────────────

  private init(): void {
    this.dialog.setAttribute("data-tatami-component", "commandPalette");
    // Overlay acts as the focus-trap container
    this.overlay.setAttribute("role", "presentation");

    // Dialog semantics
    if (!this.dialog.id) {
      this.dialog.id = `cmdpalette-${Math.random().toString(36).slice(2, 9)}`;
    }
    this.dialog.setAttribute("role", "dialog");
    this.dialog.setAttribute("aria-modal", "true");
    this.dialog.setAttribute("aria-label", "Command palette");

    // Input: combobox controlling the listbox
    if (!this.listbox.id) {
      this.listbox.id = `${this.dialog.id}-listbox`;
    }
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-controls", this.listbox.id);
    this.input.setAttribute("aria-haspopup", "listbox");
    this.input.setAttribute("autocomplete", "off");
    this.input.setAttribute("spellcheck", "false");

    // Listbox
    this.listbox.setAttribute("role", "listbox");
    this.listbox.setAttribute("aria-label", "Results");

    // Status region — live, atomic so the whole count is re-read
    this.statusRegion.setAttribute("aria-live", "polite");
    this.statusRegion.setAttribute("aria-atomic", "true");
    this.statusRegion.setAttribute("role", "status");

    // Listeners
    this.input.addEventListener("input", this.inputInputHandler);
    this.input.addEventListener("keydown", this.inputKeydownHandler);
    this.listbox.addEventListener("click", this.listboxClickHandler);
    this.overlay.addEventListener("click", this.overlayClickHandler);
    document.addEventListener("keydown", this.globalKeydownHandler);

    if (this.backdrop) {
      this.backdrop.addEventListener("click", this.backdropClickHandler);
    }

    // Render default (unfiltered) results then hide
    this.renderResults(this.commands);
    this.hideOverlay();
  }

  // ─── Rendering ─────────────────────────────────────────────────────────────

  private renderResults(items: CommandItem[]): void {
    this.listbox.innerHTML = "";
    this.itemElements.clear();
    this.activeIndex = -1;

    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.setAttribute("role", "option");
      empty.setAttribute("aria-disabled", "true");
      empty.className = "cmd-palette-empty";
      empty.textContent = "No results";
      this.listbox.appendChild(empty);
      this.statusRegion.textContent = "No results";
      this.input.removeAttribute("aria-activedescendant");
      return;
    }

    // Group items if any have a group property
    const grouped = this.groupItems(items);
    let optionIndex = 0;

    grouped.forEach(({ groupLabel, items: groupItems }) => {
      if (groupLabel) {
        const groupId = `${this.dialog.id}-group-${optionIndex}`;
        const group = document.createElement("div");
        group.setAttribute("role", "group");
        group.setAttribute("aria-labelledby", groupId);

        const heading = document.createElement("div");
        heading.id = groupId;
        heading.setAttribute("role", "presentation");
        heading.className = "cmd-palette-group-label";
        heading.textContent = groupLabel;
        group.appendChild(heading);

        groupItems.forEach((item) => {
          group.appendChild(this.buildOptionElement(item, optionIndex));
          optionIndex++;
        });

        this.listbox.appendChild(group);
      } else {
        groupItems.forEach((item) => {
          this.listbox.appendChild(this.buildOptionElement(item, optionIndex));
          optionIndex++;
        });
      }
    });

    this.statusRegion.textContent = `${items.length} result${items.length !== 1 ? "s" : ""}`;
  }

  private buildOptionElement(item: CommandItem, index: number): HTMLElement {
    const optionId = `${this.dialog.id}-opt-${item.id}`;
    const option = document.createElement("div");

    option.id = optionId;
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", "false");
    option.setAttribute("data-index", String(index));
    option.setAttribute("data-id", item.id);

    const labelEl = document.createElement("span");
    labelEl.className = "cmd-palette-label";
    labelEl.textContent = item.label;
    option.appendChild(labelEl);

    if (item.description) {
      const descEl = document.createElement("span");
      descEl.className = "cmd-palette-description";
      // Link description to option for screen readers
      descEl.id = `${optionId}-desc`;
      descEl.textContent = item.description;
      option.appendChild(descEl);
      option.setAttribute("aria-describedby", descEl.id);
    }

    if (item.shortcut) {
      const shortcutEl = document.createElement("kbd");
      shortcutEl.className = "cmd-palette-shortcut";
      shortcutEl.setAttribute("aria-label", `shortcut: ${item.shortcut}`);
      shortcutEl.textContent = item.shortcut;
      option.appendChild(shortcutEl);
    }

    this.itemElements.set(item.id, option);
    return option;
  }

  private groupItems(
    items: CommandItem[],
  ): Array<{ groupLabel: string | null; items: CommandItem[] }> {
    const map = new Map<string | null, CommandItem[]>();

    items.forEach((item) => {
      const key = item.group ?? null;
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, item]);
    });

    return Array.from(map.entries()).map(([groupLabel, items]) => ({ groupLabel, items }));
  }

  // ─── Active item management ──────────────────────────────────────────────────

  private setActiveIndex(index: number): void {
    // Clear old
    if (this.activeIndex >= 0) {
      const prev = this.getOptionAtIndex(this.activeIndex);
      prev?.setAttribute("aria-selected", "false");
    }

    this.activeIndex = index;

    if (index < 0) {
      this.input.removeAttribute("aria-activedescendant");
      return;
    }

    const el = this.getOptionAtIndex(index);
    if (!el) return;

    el.setAttribute("aria-selected", "true");
    this.input.setAttribute("aria-activedescendant", el.id);

    // Scroll into view without moving DOM focus off the input
    el.scrollIntoView?.({ block: "nearest" });
  }

  private getOptionAtIndex(index: number): HTMLElement | null {
    return this.listbox.querySelector<HTMLElement>(`[role="option"][data-index="${index}"]`);
  }

  private get totalOptions(): number {
    return this.listbox.querySelectorAll('[role="option"]:not([aria-disabled="true"])').length;
  }

  // ─── Input handling ─────────────────────────────────────────────────────────

  private handleInput(): void {
    const query = this.input.value.trim();
    this.filteredItems =
      query.length > 0 ? this.commands.filter((c) => this.filter(c, query)) : this.commands;

    this.renderResults(this.filteredItems);

    // Highlight first result automatically so arrow-down starts from position 0
    if (this.filteredItems.length > 0) {
      this.setActiveIndex(0);
      this.input.setAttribute("aria-expanded", "true");
    } else {
      this.input.setAttribute("aria-expanded", "false");
    }
  }

  private handleInputKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        this.setActiveIndex(this.activeIndex < this.totalOptions - 1 ? this.activeIndex + 1 : 0);
        break;

      case "ArrowUp":
        e.preventDefault();
        this.setActiveIndex(this.activeIndex > 0 ? this.activeIndex - 1 : this.totalOptions - 1);
        break;

      case "Enter":
        e.preventDefault();
        if (this.activeIndex >= 0) this.activateItem(this.activeIndex);
        break;

      case "Escape":
        e.preventDefault();
        this.close();
        break;

      case "Tab":
        // Tab through the dialog is fine — focus trap handles the boundary
        break;
    }
  }

  private handleListboxClick(e: MouseEvent): void {
    const option = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
    if (!option || option.getAttribute("aria-disabled") === "true") return;

    const index = Number(option.getAttribute("data-index"));
    if (!isNaN(index)) this.activateItem(index);
  }

  private handleGlobalKeyDown(e: KeyboardEvent): void {
    const isMeta = e.metaKey || e.ctrlKey;
    if (isMeta && e.key.toLowerCase() === this.hotkey.toLowerCase()) {
      e.preventDefault();
      if (this.isOpen) {
        this.close();
      } else {
        this.open();
      }
    }
  }

  // ─── Item activation ─────────────────────────────────────────────────────────

  private activateItem(index: number): void {
    const option = this.getOptionAtIndex(index);
    if (!option) return;

    const itemId = option.getAttribute("data-id");
    const item = this.commands.find((c) => c.id === itemId);
    if (!item) return;

    announce(`${item.label} executed`, { urgent: false });

    this.close();
    this.onSelect?.(item);
    // Run the action after close so focus is already restored
    item.action();
  }

  // ─── Open / close ───────────────────────────────────────────────────────────

  /**
   * Open the command palette.
   *
   * Shows the overlay, activates the focus trap, stores the current focus target,
   * and focuses the search input. Announces the available command count.
   */
  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;

    // Show all commands when opening with empty input
    this.input.value = "";
    this.filteredItems = this.commands;
    this.renderResults(this.commands);

    this.input.setAttribute("aria-expanded", this.commands.length > 0 ? "true" : "false");
    this.showOverlay();

    setInitialFocusReference((document.activeElement as HTMLElement) ?? document.body);
    pushFocusStack((document.activeElement as HTMLElement) ?? document.body);
    activateFocusTrap(this.dialog);

    // Focus the input — always. Screen reader users need to type to search
    requestAnimationFrame(() => {
      this.input.focus();
      // Pre-select first item so ArrowDown works immediately
      if (this.filteredItems.length > 0) this.setActiveIndex(0);
    });

    announce(
      `Command palette opened. ${this.commands.length} command${this.commands.length !== 1 ? "s" : ""} available. Type to filter.`,
      { urgent: false },
    );

    this.onOpen?.();
  }

  /**
   * Close the command palette.
   *
   * Hides the overlay, deactivates the focus trap, and restores focus to
   * the element that had it before opening.
   */
  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.input.setAttribute("aria-expanded", "false");
    this.input.removeAttribute("aria-activedescendant");
    this.hideOverlay();

    deactivateFocusTrap();
    popFocusStack();

    announce("Command palette closed", { urgent: false });
    this.onClose?.();
  }

  private showOverlay(): void {
    const reduced = checkReducedMotion();
    this.overlay.style.display = "block";
    if (this.backdrop) this.backdrop.style.display = "block";

    if (!reduced) {
      this.overlay.style.transition = "opacity 0.15s ease";
      this.overlay.style.opacity = "0";
      requestAnimationFrame(() => {
        this.overlay.style.opacity = "1";
      });
    }
  }

  private hideOverlay(): void {
    const reduced = checkReducedMotion();

    if (!reduced) {
      this.overlay.style.opacity = "0";
      setTimeout(() => {
        if (!this.isOpen) {
          this.overlay.style.display = "none";
          if (this.backdrop) this.backdrop.style.display = "none";
        }
      }, 150);
    } else {
      this.overlay.style.display = "none";
      if (this.backdrop) this.backdrop.style.display = "none";
    }
  }

  // ─── Public API ─────────────────────────────────────────────────────────────

  /**
   * Replace the full command list at runtime (e.g. after an async fetch).
   *
   * If the palette is currently open, the results are re-rendered immediately.
   *
   * @param commands - The new command list
   */
  public setCommands(commands: CommandItem[]): void {
    this.commands = commands;
    if (this.isOpen) {
      this.filteredItems = commands;
      this.renderResults(commands);
    }
  }

  /**
   * Add a single command without rebuilding the whole list.
   *
   * @param command - The command to add
   */
  public addCommand(command: CommandItem): void {
    this.commands = [...this.commands, command];
    if (this.isOpen) {
      this.filteredItems = this.commands;
      this.renderResults(this.commands);
    }
  }

  /**
   * Remove a command by its id.
   *
   * @param id - The id of the command to remove
   */
  public removeCommand(id: string): void {
    this.commands = this.commands.filter((c) => c.id !== id);
    if (this.isOpen) {
      this.filteredItems = this.commands;
      this.renderResults(this.commands);
    }
  }

  /**
   * Remove all event listeners and clean up the command palette.
   *
   * Closes the palette if open before cleaning up.
   */
  public destroy(): void {
    this.input.removeEventListener("input", this.inputInputHandler);
    this.input.removeEventListener("keydown", this.inputKeydownHandler);
    this.listbox.removeEventListener("click", this.listboxClickHandler);
    this.overlay.removeEventListener("click", this.overlayClickHandler);
    document.removeEventListener("keydown", this.globalKeydownHandler);

    if (this.backdrop) {
      this.backdrop.removeEventListener("click", this.backdropClickHandler);
    }

    if (this.isOpen) this.close();
  }
}

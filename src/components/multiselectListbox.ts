/**
 * @module tatami-a11y/components
 *
 * An accessible listbox component supporting single and multi-selection
 * following the WAI-ARIA listbox pattern.
 *
 * Features roving tabindex navigation, Shift+Click and Ctrl+Click selection,
 * Shift+Arrow range selection, Ctrl+A select-all, and typeahead navigation.
 */

import { createRovingTabindex } from "../shared/rovingTabindex.js";
import type { RovingTabindexController } from "../shared/rovingTabindex.js";

/**
 * Options for configuring the {@link MultiselectListbox} component.
 */
export interface MultiselectListboxOptions {
  /**
   * The container element that will assume the `listbox` role.
   * Its direct children are treated as options.
   */
  listbox: HTMLElement;
  /**
   * When true, multiple options can be selected simultaneously.
   * Sets `aria-multiselectable="true"` on the listbox.
   * @default false
   */
  multiselect?: boolean;
  /**
   * Called when the selection changes.
   *
   * @param selectedIndices - Array of indices of selected items
   */
  onSelect?: (selectedIndices: number[]) => void;
}

/**
 * An accessible listbox component following the WAI-ARIA listbox pattern.
 *
 * Supports single-selection and multi-selection modes with:
 * - Roving tabindex keyboard navigation
 * - Shift+Click and Ctrl+Click for range/toggle selection
 * - Ctrl+A for select-all
 * - Typeahead navigation by character
 * - `aria-selected` state management
 *
 * @example
 * ```typescript
 * const listbox = new MultiselectListbox({
 *   listbox: document.getElementById('my-listbox'),
 *   multiselect: true,
 * });
 * ```
 */
export class MultiselectListbox {
  private listbox: HTMLElement;
  private multiselect: boolean;
  private onSelect?: (selectedIndices: number[]) => void;
  private roving!: RovingTabindexController;
  private anchorIndex: number = 0;
  private typeaheadBuffer = "";
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressOnSelect = false;
  private clickHandler = (e: MouseEvent) => this.handleClick(e);
  private keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  /**
   * @param options - Configuration options for the listbox
   */
  constructor(options: MultiselectListboxOptions) {
    this.listbox = options.listbox;
    this.multiselect = options.multiselect ?? false;
    this.onSelect = options.onSelect;

    if (!this.listbox) return;
    this.init();
  }

  private init(): void {
    this.listbox.setAttribute("role", "listbox");
    if (this.multiselect) {
      this.listbox.setAttribute("aria-multiselectable", "true");
    }

    this.applyAriaAttributes();

    this.roving = createRovingTabindex({
      container: this.listbox,
      selector: '[role="option"]',
      orientation: "vertical",
      wrap: false,
      beforeKey: (e) => {
        switch (e.key) {
          case " ":
            if (!e.ctrlKey) {
              e.preventDefault();
              this.handleSpace();
              return true;
            }
            return false;
          case "a":
          case "A":
            if (e.ctrlKey && this.multiselect) {
              e.preventDefault();
              this.selectAll();
              return true;
            }
            return false;
          case "ArrowUp":
          case "ArrowDown":
            if (e.shiftKey && this.multiselect) {
              e.preventDefault();
              const delta = e.key === "ArrowUp" ? -1 : 1;
              const items = this.roving.getItems();
              const current = this.roving.activeIndex;
              const next = Math.max(0, Math.min(items.length - 1, current + delta));
              if (next !== current) {
                this.roving.setActiveIndex(next, true);
                this.applyRange(this.anchorIndex, next);
              }
              return true;
            }
            return false;
          case "Home":
            if (e.shiftKey && this.multiselect) {
              e.preventDefault();
              this.roving.setActiveIndex(0, true);
              this.applyRange(this.anchorIndex, 0);
              return true;
            }
            return false;
          case "End":
            if (e.shiftKey && this.multiselect) {
              e.preventDefault();
              const last = this.roving.getItems().length - 1;
              this.roving.setActiveIndex(last, true);
              this.applyRange(this.anchorIndex, last);
              return true;
            }
            return false;
          default:
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
              e.preventDefault();
              this.handleTypeahead(e.key);
              return true;
            }
            return false;
        }
      },
      onActiveChange: (index) => {
        if (!this.multiselect && !this.suppressOnSelect) {
          this.applySelection([index]);
        }
      },
    });

    this.listbox.addEventListener("click", this.clickHandler);
    this.listbox.addEventListener("keydown", this.keydownHandler);
  }

  private applyAriaAttributes(): void {
    const items = Array.from(this.listbox.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );
    items.forEach((child) => {
      child.setAttribute("role", "option");
      child.setAttribute("aria-selected", "false");
    });
  }

  private handleSpace(): void {
    const items = this.roving.getItems();
    const idx = this.roving.activeIndex;
    if (idx < 0 || idx >= items.length) return;

    if (this.multiselect) {
      this.toggleSelect(idx);
      this.anchorIndex = idx;
    } else {
      this.applySelection([idx]);
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === " " && e.ctrlKey && this.multiselect) {
      e.preventDefault();
      const items = this.roving.getItems();
      const idx = this.roving.activeIndex;
      if (idx >= 0 && idx < items.length) {
        this.toggleSelect(idx);
        this.anchorIndex = idx;
      }
    }
  }

  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const option = target.closest('[role="option"]') as HTMLElement | null;
    if (!option) return;

    const items = this.roving.getItems();
    const idx = items.indexOf(option);
    if (idx < 0) return;

    this.roving.setActiveIndex(idx, true);

    if (e.ctrlKey && this.multiselect) {
      this.toggleSelect(idx);
      this.anchorIndex = idx;
    } else if (e.shiftKey && this.multiselect) {
      this.applyRange(this.anchorIndex, idx);
    } else if (this.multiselect) {
      this.applySelection([idx]);
      this.anchorIndex = idx;
    } else {
      this.applySelection([idx]);
    }
  }

  private toggleSelect(index: number): void {
    const items = this.roving.getItems();
    if (index < 0 || index >= items.length) return;
    const item = items[index];
    const isSelected = item.getAttribute("aria-selected") === "true";
    item.setAttribute("aria-selected", String(!isSelected));
    this.emitSelection();
  }

  private applySelection(indices: number[]): void {
    const items = this.roving.getItems();
    const selectedSet = new Set(indices);
    items.forEach((el, i) => {
      el.setAttribute("aria-selected", selectedSet.has(i) ? "true" : "false");
    });
    this.emitSelection();
  }

  private applyRange(from: number, to: number): void {
    const start = Math.min(from, to);
    const end = Math.max(from, to);
    const indices: number[] = [];
    for (let i = start; i <= end; i++) {
      indices.push(i);
    }
    this.applySelection(indices);
  }

  private emitSelection(): void {
    this.onSelect?.(this.getSelectedIndices());
  }

  private handleTypeahead(key: string): void {
    this.typeaheadBuffer += key.toLowerCase();
    if (this.typeaheadTimer) clearTimeout(this.typeaheadTimer);
    this.typeaheadTimer = setTimeout(() => {
      this.typeaheadBuffer = "";
    }, 500);

    const items = this.roving.getItems();
    if (items.length === 0) return;

    const startIndex = this.roving.activeIndex;
    for (let i = 1; i <= items.length; i++) {
      const matchIdx = (startIndex + i) % items.length;
      const label = (items[matchIdx].textContent || "").toLowerCase().trim();
      if (label.startsWith(this.typeaheadBuffer)) {
        this.suppressOnSelect = true;
        this.roving.setActiveIndex(matchIdx, true);
        this.suppressOnSelect = false;
        if (this.multiselect) {
          this.anchorIndex = matchIdx;
        }
        return;
      }
    }
  }

  /**
   * Get the list of option elements managed by this listbox.
   *
   * @returns Array of option elements
   */
  getItems(): HTMLElement[] {
    return this.roving?.getItems() ?? [];
  }

  /**
   * Get the indices of currently selected items.
   *
   * @returns Array of selected indices
   */
  getSelectedIndices(): number[] {
    const items = this.roving?.getItems();
    if (!items) return [];
    const result: number[] = [];
    items.forEach((el, i) => {
      if (el.getAttribute("aria-selected") === "true") {
        result.push(i);
      }
    });
    return result;
  }

  /**
   * Select all items (only applies when {@link MultiselectListboxOptions.multiselect} is true).
   */
  selectAll(): void {
    if (!this.multiselect) return;
    const items = this.roving?.getItems();
    if (!items || items.length === 0) return;
    const indices = items.map((_, i) => i);
    this.applySelection(indices);
    this.anchorIndex = 0;
  }

  /**
   * Clear all selections.
   */
  clearSelection(): void {
    if (!this.roving) return;
    this.applySelection([]);
  }

  /**
   * Remove all event listeners and clean up the listbox.
   */
  public destroy(): void {
    if (!this.roving) return;
    this.listbox.removeEventListener("click", this.clickHandler);
    this.listbox.removeEventListener("keydown", this.keydownHandler);
    this.roving.destroy();
  }
}

/**
 * Accessible Combobox/Autocomplete Component
 *
 * A combobox that follows WAI-ARIA patterns:
 * - Uses aria-autocomplete, aria-expanded, aria-controls
 * - Filterable listbox with keyboard navigation
 * - Announces selection changes
 * - Supports custom filtering logic
 * - Respects reduced motion preference
 */

import { announce } from "../shared/announcer.js";
import { checkReducedMotion } from "../shared/reducedMotion.js";

/**
 * Options for configuring the {@link Combobox} component.
 */
export interface ComboboxOptions {
  /**
   * The text input element that receives the user's search query.
   */
  input: HTMLInputElement;
  /**
   * The listbox element containing the option elements.
   * Child elements should have `role="option"`.
   */
  listbox: HTMLElement;
  /**
   * Called when an option is selected.
   *
   * @param value - The text value of the selected option
   * @param index - The index of the selected option among visible (unfiltered) options
   */
  onSelect?: (value: string, index: number) => void;
  /**
   * Custom filter function. Receives each option's text and the current query.
   * Return true to include the option.
   *
   * @param item - The option text to evaluate
   * @param query - The current search query
   * @returns Whether the option matches the query
   * @default Case-insensitive substring match
   */
  filter?: (item: string, query: string) => boolean;
}

/**
 * An accessible combobox / autocomplete component following the WAI-ARIA combobox pattern.
 *
 * Manages an input element linked to a listbox for filtering and selecting options.
 * Supports keyboard navigation (Arrow keys, Enter, Escape), custom filtering logic,
 * and announces selection changes to assistive technology.
 *
 * @example
 * ```typescript
 * const combobox = new Combobox({
 *   input: document.getElementById('my-input'),
 *   listbox: document.getElementById('my-listbox'),
 * });
 * ```
 */
export class Combobox {
  private input: HTMLInputElement;
  private listbox: HTMLElement;
  private onSelect?: (value: string, index: number) => void;
  private filter: (item: string, query: string) => boolean;
  private options: HTMLElement[] = [];
  private isOpen: boolean = false;
  private currentIndex: number = -1;
  private inputInputHandler: () => void = () => this.handleInput();
  private inputKeydownHandler: (e: KeyboardEvent) => void = (e) => this.handleInputKeyDown(e);
  private listboxClickHandler: (e: MouseEvent) => void = (e) => this.handleListboxClick(e);
  private documentClickHandler: (e: MouseEvent) => void = (e) => this.handleDocumentClick(e);

  /**
   * @param options - Configuration options for the combobox
   */
  constructor(options: ComboboxOptions) {
    this.input = options.input;
    this.listbox = options.listbox;
    this.onSelect = options.onSelect;
    this.filter =
      options.filter ?? ((item, query) => item.toLowerCase().includes(query.toLowerCase()));

    this.init();
  }

  private init(): void {
    this.listbox.setAttribute("data-tatami-component", "combobox");
    this.input.setAttribute("role", "combobox");
    this.input.setAttribute("aria-autocomplete", "list");
    this.input.setAttribute("aria-expanded", "false");
    this.input.setAttribute("aria-controls", this.listbox.id || "combobox-listbox");
    this.listbox.setAttribute("role", "listbox");
    this.listbox.setAttribute("aria-hidden", "true");

    this.options = Array.from(this.listbox.querySelectorAll('[role="option"]'));

    this.options.forEach((option, index) => {
      option.setAttribute("aria-selected", "false");
      option.dataset.index = index.toString();
      option.dataset.value = option.textContent || "";
    });

    this.input.addEventListener("input", this.inputInputHandler);
    this.input.addEventListener("keydown", this.inputKeydownHandler);
    this.listbox.addEventListener("click", this.listboxClickHandler);
    document.addEventListener("click", this.documentClickHandler);

    this.hideListbox();
  }

  private handleInput(): void {
    const query = this.input.value;
    this.filterOptions(query);

    if (query.length > 0 && this.options.length > 0) {
      this.open();
    } else {
      this.close();
    }
  }

  private filterOptions(query: string): void {
    this.options.forEach((option) => {
      const value = option.dataset.value || option.textContent || "";
      const matches = this.filter(value, query);
      option.hidden = !matches;
      option.setAttribute("aria-hidden", matches ? "false" : "true");
    });

    const visibleOptions = this.options.filter((opt) => !opt.hidden);
    if (visibleOptions.length > 0) {
      this.currentIndex = 0;
      this.updateActiveDescendant(visibleOptions[0]);
    }
  }

  private handleInputKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!this.isOpen) {
          this.open();
        } else {
          this.moveFocus(1);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (this.isOpen) {
          this.moveFocus(-1);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (this.isOpen && this.currentIndex >= 0) {
          this.selectOption(this.currentIndex);
        }
        break;
      case "Escape":
        e.preventDefault();
        this.close();
        break;
      case "Tab":
        if (this.isOpen) {
          this.close();
        }
        break;
    }
  }

  private handleListboxClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const option = target.closest('[role="option"]') as HTMLElement;

    if (option) {
      const visibleOptions = this.options.filter((opt) => !opt.hidden);
      const visibleIndex = visibleOptions.indexOf(option);
      if (visibleIndex >= 0) {
        this.selectOption(visibleIndex);
      }
    }
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.input.contains(target) && !this.listbox.contains(target)) {
      this.close();
    }
  }

  private moveFocus(direction: number): void {
    const visibleOptions = this.options.filter((opt) => !opt.hidden);
    if (visibleOptions.length === 0) return;

    const currentVisibleIndex = visibleOptions.findIndex(
      (opt) => opt.getAttribute("aria-selected") === "true",
    );
    const newIndex = currentVisibleIndex === -1 ? 0 : currentVisibleIndex + direction;

    this.currentIndex =
      newIndex < 0 ? visibleOptions.length - 1 : newIndex >= visibleOptions.length ? 0 : newIndex;

    const activeOption = visibleOptions[this.currentIndex];
    this.updateActiveDescendant(activeOption);
    if (typeof activeOption.scrollIntoView === "function") {
      activeOption.scrollIntoView({ block: "nearest" });
    }
  }

  private updateActiveDescendant(option: HTMLElement): void {
    this.options.forEach((opt) => {
      opt.setAttribute("aria-selected", "false");
    });
    option.setAttribute("aria-selected", "true");
    this.input.setAttribute("aria-activedescendant", option.id || "");
  }

  /**
   * Select an option by its visible (unfiltered) index.
   *
   * Updates the input value, closes the listbox, and fires the {@link ComboboxOptions.onSelect} callback.
   *
   * @param index - The index of the option among visible options
   */
  public selectOption(index: number): void {
    const visibleOptions = this.options.filter((opt) => !opt.hidden);
    if (index < 0 || index >= visibleOptions.length) return;

    const option = visibleOptions[index];
    const value = option.dataset.value || "";

    this.input.value = value;
    this.close();

    announce(`Selected ${value}`, { urgent: false });

    this.onSelect?.(value, index);
  }

  /**
   * Open the listbox and display filtered options.
   *
   * Updates ARIA attributes to reflect the expanded state.
   */
  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.input.setAttribute("aria-expanded", "true");
    this.listbox.setAttribute("aria-hidden", "false");
    this.showListbox();

    const visibleOptions = this.options.filter((opt) => !opt.hidden);
    if (visibleOptions.length > 0) {
      this.currentIndex = 0;
      this.updateActiveDescendant(visibleOptions[0]);
    }
  }

  /**
   * Close the listbox and reset the active descendant.
   */
  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.input.setAttribute("aria-expanded", "false");
    this.listbox.setAttribute("aria-hidden", "true");
    this.hideListbox();

    this.currentIndex = -1;
    this.input.setAttribute("aria-activedescendant", "");
  }

  private showListbox(): void {
    const prefersReducedMotion = checkReducedMotion();
    this.listbox.style.display = "block";

    if (!prefersReducedMotion) {
      this.listbox.style.transition = "opacity 0.2s ease";
      this.listbox.style.opacity = "0";

      requestAnimationFrame(() => {
        this.listbox.style.opacity = "1";
      });
    }
  }

  private hideListbox(): void {
    const prefersReducedMotion = checkReducedMotion();

    if (!prefersReducedMotion) {
      this.listbox.style.opacity = "0";
      setTimeout(() => {
        if (!this.isOpen) {
          this.listbox.style.display = "none";
        }
      }, 200);
    } else {
      this.listbox.style.display = "none";
    }
  }

  /**
   * Remove all event listeners and clean up the combobox.
   *
   * Call this when removing the combobox from the DOM to prevent memory leaks.
   */
  public destroy(): void {
    this.input.removeEventListener("input", this.inputInputHandler);
    this.input.removeEventListener("keydown", this.inputKeydownHandler);
    this.listbox.removeEventListener("click", this.listboxClickHandler);
    document.removeEventListener("click", this.documentClickHandler);

    if (this.isOpen) {
      this.close();
    }
  }
}

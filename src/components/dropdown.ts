/**
 * Accessible Dropdown Menu Component
 *
 * A dropdown menu that follows WAI-ARIA patterns:
 * - Uses focus trap when open
 * - Uses focus stack for focus restoration
 * - Announces open/close states
 * - Supports keyboard navigation (Arrow keys, Enter, Escape)
 * - Respects reduced motion preference
 */

import {
  activateFocusTrap,
  deactivateFocusTrap,
} from '../shared/focusTrap.js';
import {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
} from '../shared/focusStack.js';
import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

/**
 * Options for configuring the {@link Dropdown} component.
 */
export interface DropdownOptions {
  /**
   * The element that triggers the dropdown menu.
   */
  trigger: HTMLElement;
  /**
   * The menu container element containing menu items.
   */
  menu: HTMLElement;
  /** Called when the dropdown opens. */
  onOpen?: () => void;
  /** Called when the dropdown closes. */
  onClose?: () => void;
}

/**
 * An accessible dropdown menu component.
 *
 * Follows the WAI-ARIA menu pattern with `role="menu"` and `role="menuitem"`.
 * Supports focus trapping when open, keyboard navigation (Arrow keys, Home, End,
 * Enter, Escape), and click-outside-to-close behavior. Menu items can use
 * `role="menuitem"`, `role="menuitemcheckbox"`, or `role="menuitemradio"`.
 *
 * @example
 * ```typescript
 * const dropdown = new Dropdown({
 *   trigger: document.getElementById('dropdown-trigger'),
 *   menu: document.getElementById('dropdown-menu'),
 * });
 * ```
 */
export class Dropdown {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private isOpen: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;
  private menuItems: HTMLElement[] = [];
  private currentIndex: number = -1;
  private triggerClickHandler: () => void = () => this.toggle();
  private triggerKeydownHandler: (e: KeyboardEvent) => void = (e) => this.handleTriggerKeyDown(e);
  private menuKeydownHandler: (e: KeyboardEvent) => void = (e) => this.handleMenuKeyDown(e);
  private documentClickHandler: (e: MouseEvent) => void = (e) => this.handleDocumentClick(e);

  /**
   * @param options - Configuration options for the dropdown
   */
  constructor(options: DropdownOptions) {
    this.trigger = options.trigger;
    this.menu = options.menu;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;

    this.init();
  }

  private init(): void {
    // Set up ARIA attributes
    this.trigger.setAttribute('aria-haspopup', 'true');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('role', 'menu');
    this.menu.setAttribute('aria-hidden', 'true');

    // Get menu items
    this.menuItems = Array.from(
      this.menu.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]')
    );

    // Set up event listeners
    this.trigger.addEventListener('click', this.triggerClickHandler);
    this.trigger.addEventListener('keydown', this.triggerKeydownHandler);
    this.menu.addEventListener('keydown', this.menuKeydownHandler);

    // Close on click outside
    document.addEventListener('click', this.documentClickHandler);

    // Initially hide menu
    this.hideMenu();
  }

  private toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Open the dropdown menu.
   *
   * Activates the focus trap, stores the current focus target, and
   * focuses the first menu item.
   */
  public open(): void {
    if (this.isOpen) return;

    this.isOpen = true;
    this.trigger.setAttribute('aria-expanded', 'true');
    this.menu.setAttribute('aria-hidden', 'false');
    this.showMenu();

    // Set up focus management
    setInitialFocusReference(this.trigger);
    pushFocusStack(this.trigger);

    // Activate focus trap
    activateFocusTrap(this.menu);

    // Focus first menu item
    if (this.menuItems.length > 0) {
      this.currentIndex = 0;
      this.menuItems[0].focus();
    }

    // Announce
    announce('Menu opened', { urgent: false });

    // Callback
    this.onOpen?.();
  }

  /**
   * Close the dropdown menu and restore focus.
   */
  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('aria-hidden', 'true');
    this.hideMenu();

    // Restore focus
    deactivateFocusTrap();
    popFocusStack();

    // Reset current index
    this.currentIndex = -1;

    // Announce
    announce('Menu closed', { urgent: false });

    // Callback
    this.onClose?.();
  }

  private showMenu(): void {
    const prefersReducedMotion = checkReducedMotion();
    this.menu.style.display = 'block';
    
    if (!prefersReducedMotion) {
      this.menu.style.transition = 'opacity 0.2s ease';
      this.menu.style.opacity = '0';
      
      requestAnimationFrame(() => {
        this.menu.style.opacity = '1';
      });
    }
  }

  private hideMenu(): void {
    const prefersReducedMotion = checkReducedMotion();
    
    if (!prefersReducedMotion) {
      this.menu.style.opacity = '0';
      setTimeout(() => {
        if (!this.isOpen) {
          this.menu.style.display = 'none';
        }
      }, 200);
    } else {
      this.menu.style.display = 'none';
    }
  }

  private handleTriggerKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        this.toggle();
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) {
          this.open();
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.isOpen) {
          this.open();
          // Focus last item
          if (this.menuItems.length > 0) {
            this.currentIndex = this.menuItems.length - 1;
            this.menuItems[this.currentIndex].focus();
          }
        }
        break;
    }
  }

  private handleMenuKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        this.close();
        this.trigger.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.moveFocus(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.moveFocus(-1);
        break;
      case 'Home':
        e.preventDefault();
        this.currentIndex = 0;
        this.menuItems[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        this.currentIndex = this.menuItems.length - 1;
        this.menuItems[this.currentIndex]?.focus();
        break;
      case 'Enter':
      case ' ': {
        e.preventDefault();
        const currentItem = this.menuItems[this.currentIndex];
        if (currentItem) {
          currentItem.click();
          this.close();
        }
        break;
      }
    }
  }

  private moveFocus(direction: number): void {
    if (this.menuItems.length === 0) return;

    this.currentIndex += direction;

    // Wrap around
    if (this.currentIndex < 0) {
      this.currentIndex = this.menuItems.length - 1;
    } else if (this.currentIndex >= this.menuItems.length) {
      this.currentIndex = 0;
    }

    this.menuItems[this.currentIndex].focus();
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.trigger.contains(target) && !this.menu.contains(target)) {
      this.close();
    } else if (this.menu.contains(target)) {
      const isMenuItem = target.closest('[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]');
      if (isMenuItem) {
        this.close();
      }
    }
  }

  /**
   * Remove all event listeners and clean up the dropdown.
   */
  public destroy(): void {
    this.trigger.removeEventListener('click', this.triggerClickHandler);
    this.trigger.removeEventListener('keydown', this.triggerKeydownHandler);
    this.menu.removeEventListener('keydown', this.menuKeydownHandler);
    document.removeEventListener('click', this.documentClickHandler);

    if (this.isOpen) {
      this.close();
    }
  }
}

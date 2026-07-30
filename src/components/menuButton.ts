/**
 * Accessible Menu Button Component
 *
 * A menu button that follows WAI-ARIA patterns:
 * - Uses aria-haspopup="menu" and aria-expanded
 * - Focus trap when menu is open
 * - Focus stack for focus restoration
 * - Announces open/close states
 * - Keyboard navigation (Arrow keys, Enter, Space, Escape)
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
 * Options for configuring the {@link MenuButton} component.
 */
export interface MenuButtonOptions {
  /**
   * The button element that triggers the menu.
   */
  trigger: HTMLElement;
  /**
   * The menu container element containing menu items.
   */
  menu: HTMLElement;
  /** Called when the menu opens. */
  onOpen?: () => void;
  /** Called when the menu closes. */
  onClose?: () => void;
}

/**
 * An accessible menu button component following WAI-ARIA patterns.
 *
 * Combines a trigger button with `aria-haspopup="menu"` and a menu panel
 * with `role="menu"`. Supports focus trapping, keyboard navigation
 * (Arrow keys, Home, End, Enter, Space, Escape), and click-outside-to-close.
 *
 * @example
 * ```typescript
 * const menu = new MenuButton({
 *   trigger: document.getElementById('menu-trigger'),
 *   menu: document.getElementById('menu-panel'),
 * });
 * ```
 */
export class MenuButton {
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
   * @param options - Configuration options for the menu button
   */
  constructor(options: MenuButtonOptions) {
    this.trigger = options.trigger;
    this.menu = options.menu;
    this.onOpen = options.onOpen;
    this.onClose = options.onClose;

    this.init();
  }

  private init(): void {
    this.trigger.setAttribute('aria-haspopup', 'menu');
    this.trigger.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('role', 'menu');
    this.menu.setAttribute('aria-hidden', 'true');

    this.menuItems = Array.from(
      this.menu.querySelectorAll('[role="menuitem"]')
    );

    this.trigger.addEventListener('click', this.triggerClickHandler);
    this.trigger.addEventListener('keydown', this.triggerKeydownHandler);
    this.menu.addEventListener('keydown', this.menuKeydownHandler);
    document.addEventListener('click', this.documentClickHandler);

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
   * Open the menu.
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

    setInitialFocusReference(this.trigger);
    pushFocusStack(this.trigger);

    activateFocusTrap(this.menu);

    if (this.menuItems.length > 0) {
      this.currentIndex = 0;
      this.menuItems[0].focus();
    }

    announce('Menu opened', { urgent: false });

    this.onOpen?.();
  }

  /**
   * Close the menu and restore focus.
   */
  public close(): void {
    if (!this.isOpen) return;

    this.isOpen = false;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.menu.setAttribute('aria-hidden', 'true');
    this.hideMenu();

    deactivateFocusTrap();
    popFocusStack();

    this.currentIndex = -1;

    announce('Menu closed', { urgent: false });

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

    const currentIndex = this.menuItems.findIndex((item) => item === document.activeElement);
    const newIndex = currentIndex === -1 ? 0 : currentIndex + direction;

    this.currentIndex = newIndex < 0 ? this.menuItems.length - 1 : newIndex >= this.menuItems.length ? 0 : newIndex;

    this.menuItems[this.currentIndex].focus();
  }

  private handleDocumentClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!this.trigger.contains(target) && !this.menu.contains(target)) {
      this.close();
    }
  }

  /**
   * Remove all event listeners and clean up the menu button.
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

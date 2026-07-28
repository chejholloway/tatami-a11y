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

export interface DropdownOptions {
  trigger: HTMLElement;
  menu: HTMLElement;
  onOpen?: () => void;
  onClose?: () => void;
}

export class Dropdown {
  private trigger: HTMLElement;
  private menu: HTMLElement;
  private isOpen: boolean = false;
  private onOpen?: () => void;
  private onClose?: () => void;
  private menuItems: HTMLElement[] = [];
  private currentIndex: number = -1;

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
    this.trigger.addEventListener('click', () => this.toggle());
    this.trigger.addEventListener('keydown', (e) => this.handleTriggerKeyDown(e));
    this.menu.addEventListener('keydown', (e) => this.handleMenuKeyDown(e));

    // Close on click outside
    document.addEventListener('click', (e) => this.handleDocumentClick(e));

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
      case ' ':
        e.preventDefault();
        const currentItem = this.menuItems[this.currentIndex];
        if (currentItem) {
          currentItem.click();
          this.close();
        }
        break;
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
    }
  }

  public destroy(): void {
    this.trigger.removeEventListener('click', () => this.toggle());
    this.trigger.removeEventListener('keydown', (e) => this.handleTriggerKeyDown(e));
    this.menu.removeEventListener('keydown', (e) => this.handleMenuKeyDown(e));
    document.removeEventListener('click', (e) => this.handleDocumentClick(e));

    if (this.isOpen) {
      this.close();
    }
  }
}

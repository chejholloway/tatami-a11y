import { createRovingTabindex } from '../shared/rovingTabindex.js';
import type { RovingTabindexController } from '../shared/rovingTabindex.js';
import { announce as defaultAnnounce } from '../shared/announcer.js';

export interface ReorderableListOptions {
  list: HTMLElement;
  orientation?: 'vertical' | 'horizontal';
  onReorder?: (items: HTMLElement[], movedItem: HTMLElement, newIndex: number) => void;
  announce?: (message: string) => void;
}

export class ReorderableList {
  private list: HTMLElement;
  private orientation: 'vertical' | 'horizontal';
  private onReorder?: (items: HTMLElement[], movedItem: HTMLElement, newIndex: number) => void;
  private announce: (message: string) => void;
  private roving!: RovingTabindexController;
  private keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);

  constructor(options: ReorderableListOptions) {
    this.list = options.list;
    this.orientation = options.orientation ?? 'vertical';
    this.onReorder = options.onReorder;
    this.announce = options.announce ?? defaultAnnounce;

    if (!this.list) return;
    this.init();
  }

  private init(): void {
    this.list.setAttribute('role', 'list');

    this.applyAriaAttributes();

    this.roving = createRovingTabindex({
      container: this.list,
      selector: '[role="listitem"]',
      orientation: this.orientation,
      wrap: false,
      beforeKey: (e) => {
        if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'Home' || e.key === 'End')) {
          return true;
        }
        return false;
      },
    });

    this.list.addEventListener('keydown', this.keydownHandler);
  }

  private applyAriaAttributes(): void {
    const items = Array.from(this.list.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );
    items.forEach((child, index) => {
      child.setAttribute('role', 'listitem');
      child.setAttribute('aria-posinset', String(index + 1));
      child.setAttribute('aria-setsize', String(items.length));
    });
  }

  private updatePosinset(): void {
    const items = this.roving.getItems();
    items.forEach((el, i) => {
      el.setAttribute('aria-posinset', String(i + 1));
      el.setAttribute('aria-setsize', String(items.length));
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (!e.ctrlKey) return;
    this.handleReorderKey(e);
  }

  private handleReorderKey(e: KeyboardEvent): boolean {
    const items = this.roving.getItems();
    const idx = this.roving.activeIndex;
    if (idx < 0 || idx >= items.length) return false;

    let targetIndex = -1;

    switch (e.key) {
      case 'ArrowUp':
        targetIndex = idx - 1;
        break;
      case 'ArrowDown':
        targetIndex = idx + 1;
        break;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = items.length - 1;
        break;
      default:
        return false;
    }

    if (targetIndex < 0 || targetIndex >= items.length || targetIndex === idx) return false;

    const item = items[idx];
    const target = items[targetIndex];
    const label = item.textContent?.trim() || 'Item';

    if (targetIndex < idx) {
      this.list.insertBefore(item, target);
    } else {
      this.list.insertBefore(item, target.nextSibling);
    }

    this.roving.refresh();
    this.updatePosinset();
    this.onReorder?.(this.roving.getItems(), item, targetIndex);
    this.announce(`${label} moved to position ${targetIndex + 1} of ${items.length}`);

    return true;
  }

  getItems(): HTMLElement[] {
    return this.roving?.getItems() ?? [];
  }

  destroy(): void {
    if (!this.roving) return;
    this.list.removeEventListener('keydown', this.keydownHandler);
    this.roving.destroy();
  }
}

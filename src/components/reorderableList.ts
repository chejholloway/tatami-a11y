import { createRovingTabindex } from '../shared/rovingTabindex.js';
import type { RovingTabindexController } from '../shared/rovingTabindex.js';
import { announce as defaultAnnounce } from '../shared/announcer.js';

export interface ReorderableListOptions {
  list: HTMLElement;
  orientation?: 'vertical' | 'horizontal';
  dragAndDrop?: boolean;
  onReorder?: (items: HTMLElement[], movedItem: HTMLElement, newIndex: number) => void;
  announce?: (message: string) => void;
}

export class ReorderableList {
  private list: HTMLElement;
  private orientation: 'vertical' | 'horizontal';
  private dragAndDrop: boolean;
  private onReorder?: (items: HTMLElement[], movedItem: HTMLElement, newIndex: number) => void;
  private announce: (message: string) => void;
  private roving!: RovingTabindexController;
  private keydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
  private dragStartHandler = (e: DragEvent) => this.handleDragStart(e);
  private dragOverHandler = (e: DragEvent) => this.handleDragOver(e);
  private dropHandler = (e: DragEvent) => this.handleDrop(e);
  private dragEndHandler = (e: DragEvent) => this.handleDragEnd(e);
  private draggedItem: HTMLElement | null = null;
  private dropIndicator: HTMLElement | null = null;

  constructor(options: ReorderableListOptions) {
    this.list = options.list;
    this.orientation = options.orientation ?? 'vertical';
    this.dragAndDrop = options.dragAndDrop ?? false;
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

    if (this.dragAndDrop) {
      this.setupDragAndDrop();
    }
  }

  private applyAriaAttributes(): void {
    const items = Array.from(this.list.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement
    );
    items.forEach((child, index) => {
      child.setAttribute('role', 'listitem');
      child.setAttribute('aria-posinset', String(index + 1));
      child.setAttribute('aria-setsize', String(items.length));
      child.draggable = this.dragAndDrop;
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
    const eventTarget = e.target as HTMLElement;
    const idx = eventTarget !== this.list ? items.indexOf(eventTarget) : this.roving.activeIndex;
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

    const newIdx = this.roving.getItems().indexOf(item);
    if (newIdx >= 0) {
      this.roving.setActiveIndex(newIdx, true);
    }

    this.onReorder?.(this.roving.getItems(), item, targetIndex);
    this.announce(`${label} moved to position ${targetIndex + 1} of ${items.length}`);

    return true;
  }

  // ── Drag and Drop ─────────────────────────────────────────────────────

  private setupDragAndDrop(): void {
    this.setDraggable(true);
    this.list.addEventListener('dragstart', this.dragStartHandler);
    this.list.addEventListener('dragover', this.dragOverHandler);
    this.list.addEventListener('drop', this.dropHandler);
    this.list.addEventListener('dragend', this.dragEndHandler);
    this.createDropIndicator();
  }

  private setDraggable(value: boolean): void {
    const items = Array.from(this.list.children) as HTMLElement[];
    items.forEach(el => {
      el.draggable = value;
    });
  }

  private createDropIndicator(): void {
    this.dropIndicator = document.createElement('div');
    this.dropIndicator.className = 'reorderable-drop-indicator';
    this.dropIndicator.style.cssText = `
      position: absolute;
      z-index: 10;
      background: #1a7f37;
      pointer-events: none;
      display: none;
    `;
    this.list.appendChild(this.dropIndicator);
    if (!this.list.style.position || this.list.style.position === 'static') {
      this.list.style.position = 'relative';
    }
  }

  private handleDragStart(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const item = target.closest('[role="listitem"]') as HTMLElement;
    if (!item) return;

    this.draggedItem = item;
    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('text/plain', '');
    item.classList.add('reorderable-dragging');
  }

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    if (!this.draggedItem) return;

    const target = e.target as HTMLElement;
    const overItem = target.closest('[role="listitem"]') as HTMLElement;
    if (!overItem || overItem === this.draggedItem) {
      this.hideDropIndicator();
      return;
    }

    const rect = overItem.getBoundingClientRect();
    const isVertical = this.orientation === 'vertical';
    const midpoint = isVertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    const cursor = isVertical ? e.clientY : e.clientX;
    const insertBefore = cursor < midpoint;

    this.showDropIndicator(overItem, insertBefore);
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.hideDropIndicator();

    if (!this.draggedItem) return;

    const target = e.target as HTMLElement;
    const overItem = target.closest('[role="listitem"]') as HTMLElement;
    if (!overItem || overItem === this.draggedItem) {
      this.draggedItem.classList.remove('reorderable-dragging');
      this.draggedItem = null;
      return;
    }

    const items = this.roving.getItems();
    const fromIdx = items.indexOf(this.draggedItem);
    const toIdx = items.indexOf(overItem);
    if (fromIdx < 0 || toIdx < 0 || fromIdx === toIdx) {
      this.draggedItem.classList.remove('reorderable-dragging');
      this.draggedItem = null;
      return;
    }

    const rect = overItem.getBoundingClientRect();
    const isVertical = this.orientation === 'vertical';
    const midpoint = isVertical ? rect.top + rect.height / 2 : rect.left + rect.width / 2;
    const cursor = isVertical ? e.clientY : e.clientX;
    const insertBefore = cursor < midpoint;

    const targetIndex = insertBefore ? toIdx : toIdx + 1;
    const label = this.draggedItem.textContent?.trim() || 'Item';

    if (insertBefore) {
      this.list.insertBefore(this.draggedItem, overItem);
    } else {
      this.list.insertBefore(this.draggedItem, overItem.nextSibling);
    }

    this.roving.refresh();
    this.updatePosinset();
    this.draggedItem.classList.remove('reorderable-dragging');

    const newIdx = this.roving.getItems().indexOf(this.draggedItem);
    if (newIdx >= 0) {
      this.roving.setActiveIndex(newIdx, true);
    }

    this.onReorder?.(this.roving.getItems(), this.draggedItem, targetIndex);
    this.announce(`${label} moved to position ${targetIndex + 1} of ${items.length}`);

    this.draggedItem = null;
  }

  private handleDragEnd(_e: DragEvent): void {
    this.hideDropIndicator();
    if (this.draggedItem) {
      this.draggedItem.classList.remove('reorderable-dragging');
      this.draggedItem = null;
    }
  }

  private showDropIndicator(overItem: HTMLElement, insertBefore: boolean): void {
    if (!this.dropIndicator) return;

    const isVertical = this.orientation === 'vertical';
    if (isVertical) {
      this.dropIndicator.style.height = '2px';
      this.dropIndicator.style.width = '100%';
      this.dropIndicator.style.left = '0';
      this.dropIndicator.style.top = insertBefore
        ? `${overItem.offsetTop}px`
        : `${overItem.offsetTop + overItem.offsetHeight}px`;
    } else {
      this.dropIndicator.style.width = '2px';
      this.dropIndicator.style.height = '100%';
      this.dropIndicator.style.top = '0';
      this.dropIndicator.style.left = insertBefore
        ? `${overItem.offsetLeft}px`
        : `${overItem.offsetLeft + overItem.offsetWidth}px`;
    }
    this.dropIndicator.style.display = 'block';
  }

  private hideDropIndicator(): void {
    if (this.dropIndicator) {
      this.dropIndicator.style.display = 'none';
    }
  }

  getItems(): HTMLElement[] {
    return this.roving?.getItems() ?? [];
  }

  destroy(): void {
    if (!this.roving) return;
    if (this.dragAndDrop) {
      this.list.removeEventListener('dragstart', this.dragStartHandler);
      this.list.removeEventListener('dragover', this.dragOverHandler);
      this.list.removeEventListener('drop', this.dropHandler);
      this.list.removeEventListener('dragend', this.dragEndHandler);
      if (this.dropIndicator && this.dropIndicator.parentNode) {
        this.dropIndicator.parentNode.removeChild(this.dropIndicator);
      }
      this.setDraggable(false);
    }
    this.list.removeEventListener('keydown', this.keydownHandler);
    this.roving.destroy();
  }
}

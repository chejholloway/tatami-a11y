/**
 * @module tatami-a11y/components
 *
 * An accessible tree view component following the WAI-ARIA tree pattern.
 *
 * Supports expand/collapse of nested nodes, single and multi-selection,
 * roving tabindex keyboard navigation, ArrowLeft/Right for collapse/expand,
 * and typeahead navigation.
 */

import { createRovingTabindex } from "../shared/rovingTabindex.js";
import type { RovingTabindexController } from "../shared/rovingTabindex.js";

/**
 * Options for configuring the {@link TreeView} component.
 */
export interface TreeViewOptions {
  /**
   * The root tree container element.
   * Receives `role="tree"`.
   */
  tree: HTMLElement;
  /**
   * When true, multiple tree nodes can be selected simultaneously.
   * @default false
   */
  multiselect?: boolean;
  /**
   * Called when a tree node is selected.
   *
   * @param node - The selected tree item element
   * @param index - The flattened index of the selected node
   */
  onSelect?: (node: HTMLElement, index: number) => void;
}

/**
 * Internal representation of a tree node and its subtree.
 */
interface TreeNode {
  /** The DOM element for this node. */
  element: HTMLElement;
  /** The text label of this node. */
  label: string;
  /** Child tree nodes. */
  children: TreeNode[];
  /** Whether this node has no children. */
  isLeaf: boolean;
}

/**
 * An accessible tree view component following the WAI-ARIA tree pattern.
 *
 * Manages a hierarchical tree with expand/collapse, single and multi-selection,
 * roving tabindex navigation, and typeahead. Expects nested `ul`/`ol` elements
 * for child subtrees.
 *
 * Keyboard navigation:
 * - ArrowUp/Down: move between visible nodes
 * - ArrowRight: expand a collapsed node
 * - ArrowLeft: collapse an expanded node or move to parent
 * - Home/End: jump to first/last visible node
 * - Enter/Space: select the focused node
 * - Typeahead: jump to a node by typing its label
 *
 * @example
 * ```typescript
 * const tree = new TreeView({
 *   tree: document.getElementById('my-tree'),
 *   multiselect: false,
 * });
 * ```
 */
export class TreeView {
  private tree: HTMLElement;
  private multiselect: boolean;
  private onSelect?: (node: HTMLElement, index: number) => void;
  private roving!: RovingTabindexController;
  private treeKeydownHandler = (e: KeyboardEvent) => this.handleKeyDown(e);
  private treeClickHandler = (e: MouseEvent) => this.handleClick(e);
  private typeaheadBuffer = "";
  private typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  private suppressOnSelect = false;

  /**
   * @param options - Configuration options for the tree view
   */
  constructor(options: TreeViewOptions) {
    this.tree = options.tree;
    this.multiselect = options.multiselect ?? false;
    this.onSelect = options.onSelect;

    if (!this.tree) return;
    this.init();
  }

  private init(): void {
    this.tree.setAttribute("role", "tree");
    if (this.multiselect) {
      this.tree.setAttribute("aria-multiselectable", "true");
    }

    this.applyAriaAttributes();
    this.refreshHiddenState();

    this.roving = createRovingTabindex({
      container: this.tree,
      selector: '[role="treeitem"]:not([aria-hidden="true"])',
      orientation: "vertical",
      wrap: false,
      beforeKey: (e) => {
        switch (e.key) {
          case "ArrowRight": {
            e.preventDefault();
            const item = this.roving.getItems()[this.roving.activeIndex];
            if (item && item.getAttribute("aria-expanded") === "false") {
              this.expand(item);
            }
            return true;
          }
          case "ArrowLeft": {
            e.preventDefault();
            const item = this.roving.getItems()[this.roving.activeIndex];
            if (item && item.getAttribute("aria-expanded") === "true") {
              this.collapse(item);
            } else {
              this.focusParent(item);
            }
            return true;
          }
          case "Enter":
          case " ":
            if (!e.ctrlKey) {
              e.preventDefault();
              const items = this.roving.getItems();
              const idx = this.roving.activeIndex;
              if (items[idx]) {
                if (this.multiselect) {
                  this.applySelection(idx);
                } else {
                  this.selectNode(idx);
                }
                this.onSelect?.(items[idx], idx);
              }
              return true;
            }
            return false;
          default:
            if (e.key.length === 1) {
              e.preventDefault();
              this.handleTypeahead(e.key);
              return true;
            }
            return false;
        }
      },
      onActiveChange: (index, element) => {
        if (!this.multiselect) {
          this.applySelection(index);
          if (!this.suppressOnSelect) {
            this.onSelect?.(element, index);
          }
        }
      },
    });

    this.tree.addEventListener("keydown", this.treeKeydownHandler);
    this.tree.addEventListener("click", this.treeClickHandler);
  }

  private applyAriaAttributes(): void {
    this.walkTree(this.tree, 1);
  }

  private walkTree(container: HTMLElement, level: number): TreeNode[] {
    const nodes: TreeNode[] = [];
    const children = Array.from(container.children).filter(
      (el): el is HTMLElement => el instanceof HTMLElement,
    );

    children.forEach((child, index) => {
      child.setAttribute("role", "treeitem");
      child.setAttribute("aria-level", String(level));

      const labelEl = child.querySelector(".label");
      const label = labelEl?.textContent || child.textContent || "";
      const sublist = child.querySelector('ul, ol, [role="group"]') as HTMLElement | null;
      const isLeaf = !sublist;

      if (sublist) {
        sublist.setAttribute("role", "group");
      }

      if (!isLeaf) {
        const isExpanded =
          child.getAttribute("aria-expanded") === "true" || child.dataset.expanded === "true";
        child.setAttribute("aria-expanded", String(isExpanded));
        if (!isExpanded && sublist) {
          sublist.hidden = true;
        }
      }

      child.setAttribute("aria-setsize", String(children.length));
      child.setAttribute("aria-posinset", String(index + 1));
      child.setAttribute("aria-selected", "false");

      nodes.push({
        element: child,
        label,
        children: sublist ? this.walkTree(sublist, level + 1) : [],
        isLeaf,
      });
    });

    return nodes;
  }

  private expand(item: HTMLElement): void {
    item.setAttribute("aria-expanded", "true");
    const sublist = item.querySelector('ul, ol, [role="group"]') as HTMLElement;
    if (sublist) sublist.hidden = false;
    this.refreshHiddenState();
    this.roving.refresh();
  }

  private collapse(item: HTMLElement): void {
    item.setAttribute("aria-expanded", "false");
    const sublist = item.querySelector('ul, ol, [role="group"]') as HTMLElement;
    if (sublist) sublist.hidden = true;
    this.refreshHiddenState();
    this.roving.refresh();
  }

  private focusParent(item: HTMLElement | undefined): void {
    if (!item) return;
    const parentItem = item
      .closest('[role="group"]')
      ?.closest('[role="treeitem"]') as HTMLElement | null;
    if (!parentItem) return;
    const items = this.roving.getItems();
    const idx = items.indexOf(parentItem);
    if (idx >= 0) {
      this.roving.setActiveIndex(idx, true);
    }
  }

  private refreshHiddenState(): void {
    const walk = (container: HTMLElement, hidden: boolean) => {
      const items = Array.from(container.children).filter(
        (el): el is HTMLElement => el instanceof HTMLElement,
      );
      items.forEach((item) => {
        if (hidden) {
          item.setAttribute("aria-hidden", "true");
        } else {
          item.removeAttribute("aria-hidden");
        }
        const sublist = item.querySelector(
          ':scope > ul, :scope > ol, :scope > [role="group"]',
        ) as HTMLElement | null;
        if (sublist) {
          const isExpanded = item.getAttribute("aria-expanded") === "true";
          walk(sublist, hidden || !isExpanded);
        }
      });
    };
    walk(this.tree, false);
  }

  private applySelection(index: number): void {
    const items = this.roving.getItems();
    if (index < 0 || index >= items.length) return;
    items.forEach((el, i) => {
      el.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === " " && e.ctrlKey && this.multiselect) {
      e.preventDefault();
      const items = this.roving.getItems();
      const idx = this.roving.activeIndex;
      if (items[idx]) {
        this.toggleSelect(items[idx], idx);
      }
    }
  }

  private handleClick(e: MouseEvent): void {
    const item = (e.target as HTMLElement).closest('[role="treeitem"]') as HTMLElement;
    if (!item) return;

    const items = this.roving.getItems();
    const idx = items.indexOf(item);
    if (idx < 0) return;

    if (e.ctrlKey && this.multiselect) {
      this.roving.setActiveIndex(idx, true);
      this.toggleSelect(item, idx);
    } else if (this.multiselect) {
      this.roving.setActiveIndex(idx, true);
      this.applySelection(idx);
      this.onSelect?.(item, idx);
    } else {
      this.selectNode(idx);
      this.onSelect?.(item, idx);
    }

    if (item.getAttribute("aria-expanded") === "false") {
      this.expand(item);
    } else if (item.getAttribute("aria-expanded") === "true") {
      this.collapse(item);
    }
  }

  private toggleSelect(item: HTMLElement, index: number): void {
    const isSelected = item.getAttribute("aria-selected") === "true";
    item.setAttribute("aria-selected", String(!isSelected));
    this.onSelect?.(item, index);
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
      const idx = (startIndex + i) % items.length;
      const label = (items[idx].textContent || "").toLowerCase().trim();
      if (label.startsWith(this.typeaheadBuffer)) {
        this.roving.setActiveIndex(idx, true);
        return;
      }
    }
  }

  /**
   * Get all currently visible tree items.
   *
   * @returns Array of visible tree item elements
   */
  getItems(): HTMLElement[] {
    return this.roving?.getItems() ?? [];
  }

  /**
   * Select a tree node by its flattened visible index.
   *
   * In multi-select mode, marks only the specified node as selected.
   * In single-select mode, clears other selections.
   *
   * @param index - The flattened index of the node to select
   */
  selectNode(index: number): void {
    const items = this.roving?.getItems();
    if (!items || index < 0 || index >= items.length) return;

    if (this.multiselect) {
      items[index].setAttribute("aria-selected", "true");
    } else {
      this.applySelection(index);
    }

    this.suppressOnSelect = true;
    this.roving.setActiveIndex(index, true);
    this.suppressOnSelect = false;
  }

  /**
   * Get the indices of all currently selected nodes.
   *
   * @returns Array of selected node indices
   */
  getSelectedNodes(): number[] {
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
   * Remove all event listeners and clean up the tree view.
   */
  public destroy(): void {
    if (!this.roving) return;
    this.tree.removeEventListener("keydown", this.treeKeydownHandler);
    this.tree.removeEventListener("click", this.treeClickHandler);
    this.roving.destroy();
  }
}

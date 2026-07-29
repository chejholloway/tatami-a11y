/**
 * Accessible Toast Notification Component
 *
 * Toast notifications that follow WAI-ARIA patterns:
 * - Uses polite/assertive live regions for screen reader announcements
 * - Auto-dismissal with configurable duration
 * - Pauses on hover/focus, resumes on leave/blur
 * - Focus stack for keyboard navigation (Alt+T to jump to toasts)
 * - Supports multiple variants (info, success, warning, error)
 * - Respects reduced motion preference
 * - HMR-safe singleton pattern
 */

import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';
import {
  pushFocusStack,
  popFocusStack,
  setInitialFocusReference,
  clearFocusStack,
} from '../shared/focusStack.js';
import { createSingleton, registerCleanup } from '../shared/globalRegistry.js';

export type ToastVariant = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';

export interface ToastOptions {
  variant?: ToastVariant;
  duration?: number;
  id?: string;
}

interface ActiveToast {
  id: string;
  element: HTMLElement;
  timer: number | null;
  cleanupTimer: number | null;
  totalDurationMs: number;
  remainingMs: number;
  startTimestamp: number | null;
}

const TOAST_VARIANT_TO_ROLE: Record<ToastVariant, 'status' | 'alert'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
};

const DEFAULT_AUTO_DISMISS_DURATION_MS = 5000;
const MAX_SIMULTANEOUS_TOASTS = 5;
const EXIT_ANIMATION_DURATION_MS = 200;
const MAX_FOCUS_STACK_SIZE = 20;
const GLOBAL_LISTENERS_KEY = '__toastGlobalListeners__';

export class Toast {
  private static stackWrapper: HTMLElement | null = null;
  private static politeLiveRegion: HTMLElement | null = null;
  private static assertiveLiveRegion: HTMLElement | null = null;
  private static toastPlacement: ToastPosition = 'top-right';
  private static activeToasts = new Map<string, ActiveToast>();
  private static toastIdCounter = 0;
  private static focusStack: HTMLElement[] = [];
  private static initialFocusReference: HTMLElement | null = null;
  private static globalFocusInHandler: ((e: FocusEvent) => void) | null = null;
  private static globalKeydownHandler: ((e: KeyboardEvent) => void) | null = null;

  private static checkReducedMotion(): boolean {
    return checkReducedMotion();
  }

  private static isInsideToast(el: EventTarget | null): boolean {
    if (!(el instanceof Element)) return false;
    return !!el.closest('.toast');
  }

  private static createStackWrapper(): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'toast-stack';
    wrapper.setAttribute('data-position', this.toastPlacement);
    document.body.appendChild(wrapper);
    return wrapper;
  }

  private static createLiveRegion(liveType: 'polite' | 'assertive'): HTMLElement {
    const region = document.createElement('div');
    region.className = `toast-region toast-region--${liveType}`;
    region.setAttribute('aria-live', liveType);
    region.setAttribute('aria-atomic', 'false');
    region.setAttribute('aria-label', 'Notifications');
    return region;
  }

  private static ensureLiveRegions(): void {
    const existingWrapper = document.querySelector('.toast-stack');
    if (existingWrapper) {
      this.stackWrapper = existingWrapper as HTMLElement;
      this.stackWrapper.setAttribute('data-position', this.toastPlacement);
    } else {
      this.stackWrapper = this.createStackWrapper();
    }

    const existingPolite = this.stackWrapper.querySelector('.toast-region--polite');
    if (existingPolite) {
      this.politeLiveRegion = existingPolite as HTMLElement;
    } else {
      this.politeLiveRegion = this.createLiveRegion('polite');
      this.stackWrapper.appendChild(this.politeLiveRegion);
    }

    const existingAssertive = this.stackWrapper.querySelector('.toast-region--assertive');
    if (existingAssertive) {
      this.assertiveLiveRegion = existingAssertive as HTMLElement;
    } else {
      this.assertiveLiveRegion = this.createLiveRegion('assertive');
      this.stackWrapper.appendChild(this.assertiveLiveRegion);
    }
  }

  private static configureToastPlacement(options: { position?: ToastPosition } = {}): void {
    this.toastPlacement = options.position ?? this.toastPlacement;
    this.ensureLiveRegions();
    if (this.stackWrapper) {
      this.stackWrapper.setAttribute('data-position', this.toastPlacement);
    }
  }

  private static scheduleToastDismissal(toastRecord: ActiveToast): void {
    if (toastRecord.totalDurationMs <= 0) return;
    toastRecord.startTimestamp = Date.now();
    toastRecord.timer = window.setTimeout(() => this.dismissToast(toastRecord.id), toastRecord.remainingMs);
  }

  private static pauseToastTimer(toastRecord: ActiveToast): void {
    if (!toastRecord.timer) return;

    clearTimeout(toastRecord.timer);
    toastRecord.timer = null;

    const elapsed = Date.now() - (toastRecord.startTimestamp ?? 0);
    toastRecord.remainingMs = Math.max(0, toastRecord.remainingMs - elapsed);
  }

  private static resumeToastTimer(toastRecord: ActiveToast): void {
    if (toastRecord.totalDurationMs <= 0 || toastRecord.timer || !this.activeToasts.has(toastRecord.id)) return;
    this.scheduleToastDismissal(toastRecord);
  }

  private static dismissToast(toastId: string, opts: { immediate?: boolean } = {}): void {
    const toastRecord = this.activeToasts.get(toastId);
    if (!toastRecord) return;

    if (toastRecord.timer) clearTimeout(toastRecord.timer);
    if (toastRecord.cleanupTimer) clearTimeout(toastRecord.cleanupTimer);
    this.activeToasts.delete(toastId);

    const isFocusedInside = toastRecord.element.contains(document.activeElement);
    if (isFocusedInside) {
      const toastValues = [...this.activeToasts.values()];
      const nextToast = toastValues[toastValues.length - 1];
      if (nextToast) {
        (nextToast.element.querySelector('.toast__close') as HTMLElement)?.focus();
      } else {
        let restored = false;
        while (this.focusStack.length > 0 && !restored) {
          const candidate = this.focusStack.pop();
          if (candidate?.isConnected) {
            candidate.focus();
            restored = true;
          }
        }
        if (!restored) {
          if (this.initialFocusReference?.isConnected) {
            this.initialFocusReference.focus();
          } else {
            (document.activeElement as HTMLElement)?.blur();
          }
        }
      }
    }

    if (this.checkReducedMotion() || opts.immediate) {
      toastRecord.element.remove();
      return;
    }

    toastRecord.element.classList.add('toast--hide');

    const cleanup = () => {
      if (toastRecord.cleanupTimer) clearTimeout(toastRecord.cleanupTimer);
      toastRecord.element.remove();
    };

    toastRecord.element.addEventListener('transitionend', cleanup, { once: true });
    toastRecord.cleanupTimer = window.setTimeout(cleanup, EXIT_ANIMATION_DURATION_MS + 100);
  }

  private static dismissAllToasts(opts: { immediate?: boolean } = {}): void {
    [...this.activeToasts.keys()].forEach((id) => this.dismissToast(id, opts));
  }

  private static setupGlobalListeners(): void {
    if (typeof window === 'undefined') return;

    const previous = (window as unknown as Record<string, unknown>)[GLOBAL_LISTENERS_KEY] as {
      focusin?: (e: FocusEvent) => void;
      keydown?: (e: KeyboardEvent) => void;
      initialFocusReference?: HTMLElement;
    } | undefined;

    if (previous) {
      if (previous.focusin) {
        window.removeEventListener('focusin', previous.focusin);
      }
      if (previous.keydown) {
        window.removeEventListener('keydown', previous.keydown);
      }
    }

    this.initialFocusReference = previous?.initialFocusReference?.isConnected
      ? previous.initialFocusReference
      : document.body;

    this.globalFocusInHandler = (e: FocusEvent) => {
      if (!this.isInsideToast(e.target)) {
        this.initialFocusReference = e.target as HTMLElement;
      }
    };

    this.globalKeydownHandler = (e: Event) => {
      if (!(e instanceof KeyboardEvent)) return;
      if (!(e.altKey && e.key.toLowerCase() === 't')) return;
      const toastValues = [...this.activeToasts.values()];
      const latestToast = toastValues[toastValues.length - 1];
      if (!latestToast) return;

      e.preventDefault();

      const current = document.activeElement;
      if (current && !this.isInsideToast(current)) {
        this.focusStack.push(current as HTMLElement);
        if (this.focusStack.length > MAX_FOCUS_STACK_SIZE) {
          this.focusStack.shift();
        }
      }
      (latestToast.element.querySelector('.toast__close') as HTMLElement)?.focus();
    };

    window.addEventListener('focusin', this.globalFocusInHandler);
    window.addEventListener('keydown', this.globalKeydownHandler);

    (window as unknown as Record<string, unknown>)[GLOBAL_LISTENERS_KEY] = {
      focusin: this.globalFocusInHandler,
      keydown: this.globalKeydownHandler,
      initialFocusReference: this.initialFocusReference,
    };

    registerCleanup(GLOBAL_LISTENERS_KEY, () => {
      if (this.globalFocusInHandler) {
        window.removeEventListener('focusin', this.globalFocusInHandler);
      }
      if (this.globalKeydownHandler) {
        window.removeEventListener('keydown', this.globalKeydownHandler);
      }
    });
  }

  public static show(message: string, options: ToastOptions = {}): string {
    if (typeof document === 'undefined') {
      console.warn('[Toast] show() called outside a browser environment; ignoring.');
      return '';
    }

    this.ensureLiveRegions();
    this.setupGlobalListeners();

    const {
      variant = 'info',
      duration = DEFAULT_AUTO_DISMISS_DURATION_MS,
      id = `toast-${++this.toastIdCounter}`,
    } = options;
    const ariaRole = TOAST_VARIANT_TO_ROLE[variant];

    if (this.activeToasts.size >= MAX_SIMULTANEOUS_TOASTS) {
      const toastKeys = [...this.activeToasts.keys()];
      const oldestToastId = toastKeys[0];
      if (oldestToastId) this.dismissToast(oldestToastId, { immediate: true });
    }

    const toastElement = document.createElement('div');
    toastElement.className = `toast toast--${variant}`;
    toastElement.setAttribute('role', ariaRole);
    toastElement.dataset.toastId = id;

    const messageSpan = document.createElement('span');
    messageSpan.className = 'toast__message';
    messageSpan.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.className = 'toast__close';
    closeButton.setAttribute('aria-label', 'Dismiss notification');
    closeButton.textContent = '\u00D7';
    closeButton.addEventListener('click', () => this.dismissToast(id));

    toastElement.append(messageSpan, closeButton);
    toastElement.addEventListener('keydown', (e: Event) => {
      if (e instanceof KeyboardEvent && e.key === 'Escape') this.dismissToast(id);
    });

    this.stackWrapper?.appendChild(toastElement);

    announce(message, { urgent: ariaRole === 'alert' });

    const toastRecord: ActiveToast = {
      id,
      element: toastElement,
      timer: null,
      cleanupTimer: null,
      totalDurationMs: duration,
      remainingMs: duration,
      startTimestamp: null,
    };

    this.activeToasts.set(id, toastRecord);
    this.scheduleToastDismissal(toastRecord);

    toastElement.addEventListener('mouseenter', () => this.pauseToastTimer(toastRecord));
    toastElement.addEventListener('mouseleave', () => this.resumeToastTimer(toastRecord));
    toastElement.addEventListener('focusin', () => this.pauseToastTimer(toastRecord));
    toastElement.addEventListener('focusout', () => this.resumeToastTimer(toastRecord));

    return id;
  }

  public static success(message: string, options?: ToastOptions): string {
    return this.show(message, { ...options, variant: 'success' });
  }

  public static error(message: string, options?: ToastOptions): string {
    return this.show(message, { ...options, variant: 'error' });
  }

  public static warning(message: string, options?: ToastOptions): string {
    return this.show(message, { ...options, variant: 'warning' });
  }

  public static info(message: string, options?: ToastOptions): string {
    return this.show(message, { ...options, variant: 'info' });
  }

  public static dismiss(id: string, opts?: { immediate?: boolean }): void {
    this.dismissToast(id, opts);
  }

  public static dismissAll(opts?: { immediate?: boolean }): void {
    this.dismissAllToasts(opts);
  }

  public static configure(options: { position?: ToastPosition }): void {
    this.configureToastPlacement(options);
  }

  public static destroy(): void {
    this.dismissAllToasts();
    this.stackWrapper?.remove();
    this.stackWrapper = null;
    this.politeLiveRegion = null;
    this.assertiveLiveRegion = null;
    this.activeToasts.clear();
    this.focusStack = [];
  }
}

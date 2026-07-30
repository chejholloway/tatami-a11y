/**
 * Accessible Carousel/Slider Component
 *
 * A carousel that follows WAI-ARIA patterns:
 * - Uses proper ARIA roles (region, roledescription, group)
 * - Accessible controls (Next/Prev, pause/play)
 * - Announces slide changes via live regions
 * - Supports keyboard navigation
 * - Respects reduced motion preference
 */

import { announce } from '../shared/announcer.js';
import { checkReducedMotion } from '../shared/reducedMotion.js';

/**
 * Options for configuring the {@link Carousel} component.
 */
export interface CarouselOptions {
  /**
   * The container element that wraps the carousel track and controls.
   */
  container: HTMLElement;
  /**
   * When true, slides advance automatically on an interval.
   * Auto-play is disabled when the user prefers reduced motion.
   * Defaults to false.
   */
  autoPlay?: boolean;
  /**
   * Interval in milliseconds between automatic slide advances.
   * Defaults to 5000 (5 seconds).
   */
  autoPlayInterval?: number;
  /**
   * Called when the active slide changes.
   *
   * @param index - The index of the newly active slide
   */
  onSlideChange?: (index: number) => void;
}

/**
 * An accessible carousel / slider component following WAI-ARIA patterns.
 *
 * Uses proper ARIA roles (`region`, `group`, `roledescription`), provides
 * accessible controls (previous, next, play/pause), announces slide changes
 * via live regions, and respects the user's reduced motion preference.
 *
 * The carousel expects DOM elements with data attributes:
 * - `[data-carousel-track]` - the element wrapping the slides
 * - `[data-carousel-slide]` - individual slide elements
 * - `[data-carousel-prev]` - previous button (optional)
 * - `[data-carousel-next]` - next button (optional)
 * - `[data-carousel-playpause]` - play/pause button (optional)
 *
 * @example
 * ```typescript
 * const carousel = new Carousel({
 *   container: document.getElementById('my-carousel'),
 *   autoPlay: true,
 * });
 * ```
 */
export class Carousel {
  private container: HTMLElement;
  private autoPlay: boolean;
  private autoPlayInterval: number;
  private onSlideChange?: (index: number) => void;

  private track!: HTMLElement;
  private slides: HTMLElement[] = [];
  private prevButton!: HTMLElement | null;
  private nextButton!: HTMLElement | null;
  private playPauseButton!: HTMLElement | null;

  private currentIndex: number = 0;
  private autoPlayTimer: ReturnType<typeof setInterval> | null = null;
  private isPlaying: boolean = false;

  private prevClickHandler = () => this.prev();
  private nextClickHandler = () => this.next();
  private playPauseClickHandler = () => this.togglePlay();

  /**
   * @param options - Configuration options for the carousel
   */
  constructor(options: CarouselOptions) {
    this.container = options.container;
    this.autoPlay = options.autoPlay ?? false;
    this.autoPlayInterval = options.autoPlayInterval ?? 5000;
    this.onSlideChange = options.onSlideChange;

    this.init();
  }

  private init(): void {
    // Basic structural attributes
    this.container.setAttribute('role', 'region');
    this.container.setAttribute('aria-roledescription', 'carousel');
    
    // Find internal elements
    this.track = this.container.querySelector('[data-carousel-track]') as HTMLElement;
    if (!this.track) {
      throw new Error('Carousel requires an element with [data-carousel-track]');
    }

    this.slides = Array.from(this.track.querySelectorAll('[data-carousel-slide]'));
    this.prevButton = this.container.querySelector('[data-carousel-prev]');
    this.nextButton = this.container.querySelector('[data-carousel-next]');
    this.playPauseButton = this.container.querySelector('[data-carousel-playpause]');

    // Setup slides
    this.slides.forEach((slide, index) => {
      slide.setAttribute('role', 'group');
      slide.setAttribute('aria-roledescription', 'slide');
      // aria-label for '1 of 5' is helpful for screen readers
      if (!slide.getAttribute('aria-label')) {
        slide.setAttribute('aria-label', `${index + 1} of ${this.slides.length}`);
      }
    });

    // Attach controls
    if (this.prevButton) {
      this.prevButton.setAttribute('aria-label', 'Previous slide');
      this.prevButton.addEventListener('click', this.prevClickHandler);
    }
    
    if (this.nextButton) {
      this.nextButton.setAttribute('aria-label', 'Next slide');
      this.nextButton.addEventListener('click', this.nextClickHandler);
    }

    if (this.playPauseButton) {
      this.playPauseButton.addEventListener('click', this.playPauseClickHandler);
    }

    // Initialize state
    const prefersReducedMotion = checkReducedMotion();
    if (prefersReducedMotion) {
      this.autoPlay = false; // Always disable auto-play for reduced motion
    }

    this.updateAriaStates();

    if (this.autoPlay) {
      this.play();
    } else {
      this.pause(); // sets initial aria labels
    }
  }

  /**
   * Navigate to a specific slide by index.
   *
   * Wraps around at boundaries (negative indices go to the last slide).
   *
   * @param index - The target slide index
   * @param shouldAnnounce - When true (default), announces the slide change via the live region
   */
  public goToSlide(index: number, shouldAnnounce: boolean = true): void {
    if (this.slides.length === 0) return;

    // Wrap around logic
    if (index < 0) {
      this.currentIndex = this.slides.length - 1;
    } else if (index >= this.slides.length) {
      this.currentIndex = 0;
    } else {
      this.currentIndex = index;
    }

    this.updateAriaStates();

    const slideName = this.slides[this.currentIndex].getAttribute('aria-label') || `Slide ${this.currentIndex + 1}`;
    
    if (shouldAnnounce) {
      announce(`${slideName}`, { urgent: false });
    }

    this.onSlideChange?.(this.currentIndex);
  }

  /**
   * Advance to the next slide.
   *
   * Pauses auto-play if active (user interaction stops auto-advance).
   */
  public next(): void {
    if (this.isPlaying) this.pause(); // User interaction pauses autoplay
    this.goToSlide(this.currentIndex + 1);
  }

  /**
   * Go back to the previous slide.
   *
   * Pauses auto-play if active (user interaction stops auto-advance).
   */
  public prev(): void {
    if (this.isPlaying) this.pause(); // User interaction pauses autoplay
    this.goToSlide(this.currentIndex - 1);
  }

  private updateAriaStates(): void {
    this.slides.forEach((slide, index) => {
      const isActive = index === this.currentIndex;
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      
      // Update visual styles depending on motion preference
      const prefersReducedMotion = checkReducedMotion();
      if (!prefersReducedMotion) {
        slide.style.transition = 'opacity 0.3s ease';
        slide.style.opacity = isActive ? '1' : '0';
        slide.style.position = isActive ? 'relative' : 'absolute';
        slide.style.display = '';
      } else {
        slide.style.display = isActive ? 'block' : 'none';
      }
    });
  }

  /**
   * Toggle between playing and paused states.
   */
  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  /**
   * Start auto-advancing slides.
   *
   * Does nothing if there is only one slide or if the user prefers reduced motion.
   */
  public play(): void {
    if (this.slides.length <= 1) return;
    const prefersReducedMotion = checkReducedMotion();
    if (prefersReducedMotion) return; // Prevent autoplay if motion is reduced

    this.isPlaying = true;
    if (this.playPauseButton) {
      this.playPauseButton.setAttribute('aria-label', 'Stop slide rotation');
    }

    // Clear existing timer if any
    if (this.autoPlayTimer) clearInterval(this.autoPlayTimer);

    this.autoPlayTimer = setInterval(() => {
      this.goToSlide(this.currentIndex + 1, false); // Don't constantly announce automated slides
    }, this.autoPlayInterval);
  }

  /**
   * Pause auto-advancement.
   */
  public pause(): void {
    this.isPlaying = false;
    if (this.playPauseButton) {
      this.playPauseButton.setAttribute('aria-label', 'Start slide rotation');
    }

    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
  }

  /**
   * Remove all event listeners and clean up the carousel.
   *
   * Call this when removing the carousel from the DOM to prevent memory leaks.
   */
  public destroy(): void {
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
    }
    
    if (this.prevButton) {
      this.prevButton.removeEventListener('click', this.prevClickHandler);
    }
    
    if (this.nextButton) {
      this.nextButton.removeEventListener('click', this.nextClickHandler);
    }

    if (this.playPauseButton) {
      this.playPauseButton.removeEventListener('click', this.playPauseClickHandler);
    }
  }
}

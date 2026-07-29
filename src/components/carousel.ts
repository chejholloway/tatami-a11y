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

export interface CarouselOptions {
  container: HTMLElement;
  autoPlay?: boolean;
  autoPlayInterval?: number;
  onSlideChange?: (index: number) => void;
}

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
  private autoPlayTimer: any = null;
  private isPlaying: boolean = false;

  private prevClickHandler = () => this.prev();
  private nextClickHandler = () => this.next();
  private playPauseClickHandler = () => this.togglePlay();

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

  public next(): void {
    if (this.isPlaying) this.pause(); // User interaction pauses autoplay
    this.goToSlide(this.currentIndex + 1);
  }

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

  public togglePlay(): void {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

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

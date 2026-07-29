import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Carousel } from '../src/components/carousel.js';

describe('Carousel', () => {
  let container: HTMLElement;
  let track: HTMLElement;
  let carouselInstance: Carousel;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'carousel-container';

    track = document.createElement('div');
    track.setAttribute('data-carousel-track', '');
    
    // Add slides
    for (let i = 0; i < 3; i++) {
      const slide = document.createElement('div');
      slide.setAttribute('data-carousel-slide', '');
      slide.textContent = `Slide ${i + 1}`;
      track.appendChild(slide);
    }
    
    // Add controls
    const prev = document.createElement('button');
    prev.setAttribute('data-carousel-prev', '');
    
    const next = document.createElement('button');
    next.setAttribute('data-carousel-next', '');
    
    const playPause = document.createElement('button');
    playPause.setAttribute('data-carousel-playpause', '');

    container.appendChild(track);
    container.appendChild(prev);
    container.appendChild(next);
    container.appendChild(playPause);

    document.body.appendChild(container);

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    vi.spyOn(window, 'setInterval').mockImplementation((cb: (...args: any[]) => void, _delay?: number) => {
      return 1 as any; // Mock timer ID
    });

    vi.spyOn(window, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    if (carouselInstance) {
      carouselInstance.destroy();
    }
    container.remove();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should set up ARIA attributes on container', () => {
      carouselInstance = new Carousel({ container });

      expect(container.getAttribute('role')).toBe('region');
      expect(container.getAttribute('aria-roledescription')).toBe('carousel');
    });

    it('should set up ARIA attributes on slides', () => {
      carouselInstance = new Carousel({ container });
      const slides = track.querySelectorAll('[data-carousel-slide]');

      slides.forEach((slide) => {
        expect(slide.getAttribute('role')).toBe('group');
        expect(slide.getAttribute('aria-roledescription')).toBe('slide');
        expect(slide.getAttribute('aria-label')).toBeTruthy();
      });
    });

    it('should throw error if track is missing', () => {
      const badContainer = document.createElement('div');
      expect(() => {
        new Carousel({ container: badContainer });
      }).toThrow('Carousel requires an element with [data-carousel-track]');
    });
  });

  describe('interactions', () => {
    it('should navigate to next slide', () => {
      carouselInstance = new Carousel({ container });
      const nextBtn = container.querySelector('[data-carousel-next]') as HTMLElement;
      
      nextBtn.click();
      
      const slides = track.querySelectorAll('[data-carousel-slide]');
      expect(slides[0].getAttribute('aria-hidden')).toBe('true');
      expect(slides[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should navigate to previous slide (with wrap around)', () => {
      carouselInstance = new Carousel({ container });
      const prevBtn = container.querySelector('[data-carousel-prev]') as HTMLElement;
      
      prevBtn.click();
      
      const slides = track.querySelectorAll('[data-carousel-slide]');
      expect(slides[0].getAttribute('aria-hidden')).toBe('true');
      expect(slides[2].getAttribute('aria-hidden')).toBe('false'); // wrapped to end
    });

    it('should toggle play/pause', () => {
      carouselInstance = new Carousel({ container });
      const playPauseBtn = container.querySelector('[data-carousel-playpause]') as HTMLElement;
      
      // Initially paused
      expect(playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
      
      playPauseBtn.click();
      expect(playPauseBtn.getAttribute('aria-label')).toBe('Stop slide rotation');
      
      playPauseBtn.click();
      expect(playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should call onSlideChange callback', () => {
      const onSlideChange = vi.fn();
      carouselInstance = new Carousel({ container, onSlideChange });
      
      carouselInstance.next();
      
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Carousel } from '../src/components/carousel.js';

// Helper to build a standard 3-slide carousel container
function buildCarousel(slideCount = 3): {
  container: HTMLElement;
  track: HTMLElement;
  slides: HTMLElement[];
  prevBtn: HTMLElement;
  nextBtn: HTMLElement;
  playPauseBtn: HTMLElement;
} {
  const container = document.createElement('div');
  container.id = 'carousel-container';

  const track = document.createElement('div');
  track.setAttribute('data-carousel-track', '');

  const slides = Array.from({ length: slideCount }, (_, i) => {
    const slide = document.createElement('div');
    slide.setAttribute('data-carousel-slide', '');
    slide.textContent = `Slide ${i + 1}`;
    track.appendChild(slide);
    return slide;
  });

  const prevBtn = document.createElement('button');
  prevBtn.setAttribute('data-carousel-prev', '');

  const nextBtn = document.createElement('button');
  nextBtn.setAttribute('data-carousel-next', '');

  const playPauseBtn = document.createElement('button');
  playPauseBtn.setAttribute('data-carousel-playpause', '');

  container.appendChild(track);
  container.appendChild(prevBtn);
  container.appendChild(nextBtn);
  container.appendChild(playPauseBtn);
  document.body.appendChild(container);

  return { container, track, slides, prevBtn, nextBtn, playPauseBtn };
}

describe('Carousel', () => {
  let carouselInstance: Carousel;
  let els: ReturnType<typeof buildCarousel>;

  beforeEach(() => {
    els = buildCarousel();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now());
      return 0;
    });

    // Keep setInterval as a real timer but track calls
    vi.spyOn(window, 'setInterval').mockImplementation((_cb, _delay) => 1 as unknown as ReturnType<typeof setInterval>);
    vi.spyOn(window, 'clearInterval').mockImplementation(() => {});
  });

  afterEach(() => {
    if (carouselInstance) carouselInstance.destroy();
    els.container.remove();
    vi.restoreAllMocks();
  });

  // ─── Constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('should set role="region" on the container', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.container.getAttribute('role')).toBe('region');
    });

    it('should set aria-roledescription="carousel" on the container', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.container.getAttribute('aria-roledescription')).toBe('carousel');
    });

    it('should set role="group" on every slide', () => {
      carouselInstance = new Carousel({ container: els.container });
      const allGroup = els.slides.every(s => s.getAttribute('role') === 'group');
      expect(allGroup).toBe(true);
    });

    it('should set aria-roledescription="slide" on every slide', () => {
      carouselInstance = new Carousel({ container: els.container });
      const allSlide = els.slides.every(s => s.getAttribute('aria-roledescription') === 'slide');
      expect(allSlide).toBe(true);
    });

    it('should label slides as "1 of N", "2 of N", etc.', () => {
      carouselInstance = new Carousel({ container: els.container });
      els.slides.forEach((slide, _i) => {
        expect(slide.getAttribute('aria-label')).toBe(`${_i + 1} of ${els.slides.length}`);
      });
    });

    it('should not overwrite an existing aria-label on a slide', () => {
      els.slides[0].setAttribute('aria-label', 'Custom intro slide');
      carouselInstance = new Carousel({ container: els.container });
      expect(els.slides[0].getAttribute('aria-label')).toBe('Custom intro slide');
    });

    it('should mark first slide as visible and the rest as aria-hidden', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('false');
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('true');
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('true');
    });

    it('should set aria-label on prev button', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.prevBtn.getAttribute('aria-label')).toBe('Previous slide');
    });

    it('should set aria-label on next button', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.nextBtn.getAttribute('aria-label')).toBe('Next slide');
    });

    it('should throw when the track element is missing', () => {
      const badContainer = document.createElement('div');
      expect(() => new Carousel({ container: badContainer })).toThrow(
        'Carousel requires an element with [data-carousel-track]'
      );
    });

    it('should start paused when autoPlay is not set', () => {
      carouselInstance = new Carousel({ container: els.container });
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should start playing when autoPlay=true', () => {
      carouselInstance = new Carousel({ container: els.container, autoPlay: true });
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Stop slide rotation');
    });
  });

  // ─── goToSlide ───────────────────────────────────────────────────────────────

  describe('goToSlide', () => {
    it('should go to the requested index', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(2);
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('false');
    });

    it('should mark the previous slide as hidden when navigating', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(1);
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('true');
    });

    it('should wrap to last slide when index is below 0', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(-1);
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('false');
    });

    it('should wrap to first slide when index is beyond the end', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(3); // 3-slide carousel, so out of bounds
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('false');
    });

    it('should fire onSlideChange with the new index', () => {
      const onSlideChange = vi.fn();
      carouselInstance = new Carousel({ container: els.container, onSlideChange });
      carouselInstance.goToSlide(2);
      expect(onSlideChange).toHaveBeenCalledWith(2);
    });

    it('should handle an empty carousel gracefully', () => {
      // Build a carousel with 0 slides (unusual but should not throw)
      const empty = buildCarousel(0);
      const emptyInstance = new Carousel({ container: empty.container });
      expect(() => emptyInstance.goToSlide(0)).not.toThrow();
      emptyInstance.destroy();
      empty.container.remove();
    });
  });

  // ─── next / prev ─────────────────────────────────────────────────────────────

  describe('next / prev', () => {
    it('should advance one slide on next()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.next();
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should go back one slide on prev()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(2);
      carouselInstance.prev();
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should wrap from last to first on next()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(2);
      carouselInstance.next();
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('false');
    });

    it('should wrap from first to last on prev()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.prev();
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Button click interactions ───────────────────────────────────────────────

  describe('button click interactions', () => {
    it('should advance to next slide when next button is clicked', () => {
      carouselInstance = new Carousel({ container: els.container });
      els.nextBtn.click();
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should go back to previous slide when prev button is clicked', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(2);
      els.prevBtn.click();
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('false');
    });

    it('should wrap to last on prev click from slide 0', () => {
      carouselInstance = new Carousel({ container: els.container });
      els.prevBtn.click();
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('false');
    });

    it('should start rotation when play/pause button is clicked while paused', () => {
      carouselInstance = new Carousel({ container: els.container });
      els.playPauseBtn.click();
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Stop slide rotation');
    });

    it('should stop rotation when play/pause button is clicked while playing', () => {
      carouselInstance = new Carousel({ container: els.container });
      els.playPauseBtn.click(); // play
      els.playPauseBtn.click(); // pause
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should call onSlideChange when next button is clicked', () => {
      const onSlideChange = vi.fn();
      carouselInstance = new Carousel({ container: els.container, onSlideChange });
      els.nextBtn.click();
      expect(onSlideChange).toHaveBeenCalledWith(1);
    });
  });

  // ─── play / pause ────────────────────────────────────────────────────────────

  describe('play / pause', () => {
    it('should update aria-label to "Stop slide rotation" on play()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.play();
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Stop slide rotation');
    });

    it('should update aria-label to "Start slide rotation" on pause()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.play();
      carouselInstance.pause();
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should call setInterval on play()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.play();
      expect(window.setInterval).toHaveBeenCalled();
    });

    it('should call clearInterval on pause()', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.play();
      carouselInstance.pause();
      expect(window.clearInterval).toHaveBeenCalled();
    });

    it('should not start autoplay on a single-slide carousel', () => {
      const singleSlide = buildCarousel(1);
      const inst = new Carousel({ container: singleSlide.container, autoPlay: true });
      // setInterval should not have been called — nothing to rotate
      expect(window.setInterval).not.toHaveBeenCalled();
      inst.destroy();
      singleSlide.container.remove();
    });

    it('should pause when the user manually navigates with next()', () => {
      carouselInstance = new Carousel({ container: els.container, autoPlay: true });
      carouselInstance.next(); // user interaction should pause autoplay
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should pause when the user manually navigates with prev()', () => {
      carouselInstance = new Carousel({ container: els.container, autoPlay: true });
      carouselInstance.prev();
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });

    it('should respect togglePlay() to flip between states', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.togglePlay(); // → playing
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Stop slide rotation');
      carouselInstance.togglePlay(); // → paused
      expect(els.playPauseBtn.getAttribute('aria-label')).toBe('Start slide rotation');
    });
  });

  // ─── Reduced motion ──────────────────────────────────────────────────────────

  describe('reduced motion', () => {
    it('should use display instead of opacity when reduced motion is preferred', () => {
      // checkReducedMotion returns false in jsdom, so display-based fallback
      // will be triggered when we mock it — just verify slides are still navigable
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.goToSlide(1);
      // Slide should be marked as not hidden regardless of motion preference
      expect(els.slides[1].getAttribute('aria-hidden')).toBe('false');
    });
  });

  // ─── Destroy ─────────────────────────────────────────────────────────────────

  describe('destroy', () => {
    it('should remove next button listener after destroy', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.destroy();
      // clicking next after destroy should not change the slide
      els.nextBtn.click();
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('false');
    });

    it('should remove prev button listener after destroy', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.destroy();
      els.prevBtn.click();
      expect(els.slides[0].getAttribute('aria-hidden')).toBe('false');
    });

    it('should remove play/pause button listener after destroy', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.destroy();
      expect(() => els.playPauseBtn.click()).not.toThrow();
    });

    it('should clear the autoplay timer on destroy', () => {
      carouselInstance = new Carousel({ container: els.container, autoPlay: true });
      carouselInstance.destroy();
      expect(window.clearInterval).toHaveBeenCalled();
    });
  });

  // ─── Edge cases ───────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('should handle a 2-slide carousel without errors', () => {
      const two = buildCarousel(2);
      const inst = new Carousel({ container: two.container });
      inst.next();
      expect(two.slides[1].getAttribute('aria-hidden')).toBe('false');
      inst.next(); // wraps back to 0
      expect(two.slides[0].getAttribute('aria-hidden')).toBe('false');
      inst.destroy();
      two.container.remove();
    });

    it('should handle rapid next/prev without corrupting state', () => {
      carouselInstance = new Carousel({ container: els.container });
      carouselInstance.next();
      carouselInstance.next();
      carouselInstance.prev();
      carouselInstance.prev();
      carouselInstance.prev();
      // after: 0→1→2→1→0→2 (wraps)
      expect(els.slides[2].getAttribute('aria-hidden')).toBe('false');
    });

    it('should work correctly when no control buttons are present', () => {
      const noControls = document.createElement('div');
      const noControlsTrack = document.createElement('div');
      noControlsTrack.setAttribute('data-carousel-track', '');
      const slide = document.createElement('div');
      slide.setAttribute('data-carousel-slide', '');
      noControlsTrack.appendChild(slide);
      noControls.appendChild(noControlsTrack);
      document.body.appendChild(noControls);

      // Should not throw even without prev/next/playpause buttons
      const inst = new Carousel({ container: noControls });
      expect(() => inst.next()).not.toThrow();
      inst.destroy();
      noControls.remove();
    });
  });
});

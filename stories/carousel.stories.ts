import type { Meta, StoryObj } from '@storybook/html';

const meta: Meta = {
  title: 'Carousel',
  render: () => `
    <div id="carousel-demo" class="carousel-demo">
      <div data-carousel-track class="carousel-track-demo">
        <div data-carousel-slide class="carousel-slide-demo">
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
            <circle cx="40" cy="40" r="38" fill="#bbdefb" />
            <polygon points="40,12 68,62 12,62" fill="#1565c0" opacity=".7" />
            <circle cx="58" cy="20" r="8" fill="#fff9c4" opacity=".9" />
          </svg>
          <span class="carousel-slide-caption">Slide 1</span>
          <span class="carousel-slide-sub">Slide 1 of 3</span>
        </div>
        <div data-carousel-slide class="carousel-slide-demo">
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
            <circle cx="40" cy="40" r="38" fill="#fce4ec" />
            <path d="M10 46 Q25 38 40 46 Q55 54 70 46" stroke="#880e4f" stroke-width="2.5" fill="none" opacity=".6" />
            <ellipse cx="40" cy="28" rx="16" ry="12" fill="#f48fb1" opacity=".55" />
          </svg>
          <span class="carousel-slide-caption">Slide 2</span>
          <span class="carousel-slide-sub">Slide 2 of 3</span>
        </div>
        <div data-carousel-slide class="carousel-slide-demo">
          <svg viewBox="0 0 80 80" fill="none" aria-hidden="true" focusable="false">
            <circle cx="40" cy="40" r="38" fill="#e8f5e9" />
            <polygon points="40,14 58,50 22,50" fill="#2e7d32" opacity=".85" />
          </svg>
          <span class="carousel-slide-caption">Slide 3</span>
          <span class="carousel-slide-sub">Slide 3 of 3</span>
        </div>
      </div>
      <div class="carousel-controls-demo">
        <button class="btn-secondary" data-carousel-prev>← Previous</button>
        <button class="btn-primary" data-carousel-playpause>Pause</button>
        <button class="btn-secondary" data-carousel-next>Next →</button>
      </div>
    </div>
  `,
};

export default meta;

export const Default: StoryObj = {};

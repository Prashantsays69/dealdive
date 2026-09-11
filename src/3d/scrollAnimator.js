/* ============================================================
   ScrollAnimator — Maps scroll progress to object transforms
   Provides smooth, damped scroll-driven animations.
   ============================================================ */

/**
 * Linear interpolation
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map a value from one range to another
 */
export function mapRange(value, inMin, inMax, outMin, outMax) {
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return lerp(outMin, outMax, t);
}

/**
 * Ease in-out cubic
 */
export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Get the scroll progress for a specific section
 * @param {HTMLElement} element - The DOM element
 * @returns {{ progress: number, isVisible: boolean }}
 */
export function getSectionProgress(element) {
  if (!element) return { progress: 0, isVisible: false };

  const rect = element.getBoundingClientRect();
  const windowH = window.innerHeight;

  // Progress: 0 when element enters viewport, 1 when it leaves
  const progress = clamp(
    1 - (rect.top / windowH),
    0,
    1 + (rect.height / windowH)
  );

  const isVisible = rect.top < windowH && rect.bottom > 0;

  return { progress: clamp(progress, 0, 2), isVisible };
}

/**
 * Create a scroll-triggered animation controller
 * @param {Object} config
 * @param {HTMLElement} config.element - DOM element to observe
 * @param {number} config.startOffset - When to start (0 = element enters viewport bottom)
 * @param {number} config.endOffset - When to end (1 = element at viewport top)
 * @param {Function} config.onUpdate - Called with progress (0-1) on each scroll
 */
export function createScrollTrigger(config) {
  const {
    element,
    startOffset = 0,
    endOffset = 1,
    onUpdate,
  } = config;

  let lastProgress = -1;

  function update() {
    if (!element) return;

    const { progress, isVisible } = getSectionProgress(element);

    if (!isVisible && lastProgress <= 0) return;

    const mapped = mapRange(progress, startOffset, endOffset, 0, 1);
    const eased = easeInOutCubic(mapped);

    if (Math.abs(eased - lastProgress) > 0.001) {
      onUpdate(eased, mapped);
      lastProgress = eased;
    }
  }

  // Listen to scroll
  window.addEventListener('scroll', update, { passive: true });
  // Initial check
  update();

  return {
    update,
    destroy: () => window.removeEventListener('scroll', update),
  };
}

/**
 * Reveal animation on scroll — adds class when element enters viewport
 */
export function observeReveal(elements, className = 'revealed', threshold = 0.15) {
  if (!elements || elements.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add(className);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold, rootMargin: '0px 0px -50px 0px' }
  );

  elements.forEach(el => observer.observe(el));

  return observer;
}

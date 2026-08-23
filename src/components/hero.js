/* ============================================================
   Hero Carousel Component
   ============================================================ */

import { $, el, icons, lazyImage } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { fetchHeroDeals, getHeroImage, getGameImage, getDealLink } from '../api/cheapshark.js';

let currentSlide = 0;
let autoplayTimer = null;
let slides = [];

export async function initHero(storesMap) {
  const hero = $('#hero');
  if (!hero) return;

  try {
    const deals = await fetchHeroDeals();

    slides = deals;
    if (!slides || slides.length === 0) {
      hero.style.display = 'none';
      return;
    }

    hero.style.display = 'block';
    renderHero(hero, slides, storesMap);
    startAutoplay();

  } catch (err) {
    console.error('Hero load failed:', err);
    hero.style.display = 'none';
  }
}

function renderHero(container, deals, storesMap) {
  const carousel = el('div', { class: 'hero-carousel' });

  deals.forEach((deal, i) => {
    const savings = Math.round(parseFloat(deal.savings));
    const salePrice = parseFloat(deal.salePrice);
    const normalPrice = parseFloat(deal.normalPrice);
    const store = storesMap.get(deal.storeID);
    const storeName = store ? store.storeName : 'Store';
    const heroImg = getHeroImage(deal);
    const fallbackImg = getGameImage(deal);

    const slide = el('div', { class: `hero-slide${i === 0 ? ' active' : ''}`, dataset: { index: i } });

    slide.innerHTML = `
      <div class="hero-slide-bg" style="background-image: url('${heroImg}'), url('${fallbackImg}')"></div>
      <div class="hero-slide-overlay"></div>
      <div class="hero-slide-content">
        <div class="hero-deal-badge">${icons.tag} ${savings > 0 ? `${savings}% off` : 'Hot Deal'}</div>
        <h2 class="hero-title">${deal.title}</h2>
        <div class="hero-meta">
          <span class="hero-store">${storeName}</span>
        </div>
        <div class="hero-price-block">
          <span class="hero-price-current">${formatPrice(deal.salePrice)}</span>
          ${normalPrice > salePrice ? `<span class="hero-price-original">${formatPrice(deal.normalPrice)}</span>` : ''}
        </div>
        <a href="${getDealLink(deal)}" target="_blank" rel="noopener noreferrer" class="hero-cta" style="margin-top: var(--space-4);">
          View Deal ${icons.arrowRight}
        </a>
      </div>
    `;

    carousel.appendChild(slide);
  });

  // Navigation dots
  const dots = el('div', { class: 'hero-dots' });
  deals.forEach((_, i) => {
    const dot = el('button', {
      class: `hero-dot${i === 0 ? ' active' : ''}`,
      'aria-label': `Slide ${i + 1}`,
      onClick: () => goToSlide(i),
    });
    dots.appendChild(dot);
  });

  container.innerHTML = '';
  container.appendChild(carousel);
  container.appendChild(dots);

  // Pause on hover
  container.addEventListener('mouseenter', stopAutoplay);
  container.addEventListener('mouseleave', startAutoplay);
}

function goToSlide(index) {
  const allSlides = $$('.hero-slide');
  const allDots = $$('.hero-dot');

  if (!allSlides.length) return;

  currentSlide = index % allSlides.length;

  allSlides.forEach((s, i) => s.classList.toggle('active', i === currentSlide));
  allDots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

function nextSlide() {
  goToSlide(currentSlide + 1);
}

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(nextSlide, 6000);
}

function stopAutoplay() {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
}

// Local $$ since we need it for querySelectorAll
function $$sel(sel) {
  return [...document.querySelectorAll(sel)];
}
// Override the local helper
const $$ = $$sel;

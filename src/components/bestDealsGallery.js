/* ============================================================
   Best Deals Gallery — Horizontal-scrolling 3D card gallery
   CSS 3D perspective cards with mouse-tilt interaction.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount, metacriticTier } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { observeReveal } from '../3d/scrollAnimator.js';

export async function initBestDealsGallery({ storesMap }) {
  const container = $('#best-deals-gallery');
  if (!container) return;

  let deals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Deal Rating',
      pageSize: 30,
      onSale: true,
      storeID: '1,25',
    });
    deals = deduplicateDeals(raw).filter(d => d.steamAppID).slice(0, 12);
  } catch (err) {
    console.error('Best deals fetch failed:', err);
    return;
  }

  if (deals.length === 0) {
    container.style.display = 'none';
    return;
  }

  renderGallery(container, deals, storesMap);
}

function renderGallery(container, deals, storesMap) {
  const sectionLabel = el('div', { class: 'section-label meta-label' }, 'Best Deals Right Now');
  const sectionTitle = el('h2', { class: 'section-title display-h1' });
  sectionTitle.innerHTML = 'Top-Rated <span class="text-accent">Deals</span>';

  const track = el('div', { class: 'gallery-track', id: 'gallery-track' });

  deals.forEach((deal, i) => {
    const savings = Math.round(parseFloat(deal.savings));
    const salePrice = parseFloat(deal.salePrice);
    const normalPrice = parseFloat(deal.normalPrice);
    const isFree = salePrice === 0;
    const store = storesMap.get(deal.storeID);
    const storeName = store ? store.storeName : '';
    const storeLogo = store ? getStoreLogo(store.images) : '';
    const gameImg = getGameImage(deal);
    const dealLink = getDealLink(deal);
    const mcTier = metacriticTier(deal.metacriticScore);
    const metacritic = parseInt(deal.metacriticScore);

    const card = el('div', {
      class: 'gallery-card reveal-item',
      style: `--i: ${i}`,
      dataset: { dealId: deal.dealID },
    });

    card.innerHTML = `
      <div class="gallery-card-image">
        <img src="${gameImg}" alt="${deal.title}" loading="lazy"
             onload="this.classList.add('loaded')" onerror="this.style.display='none'" />
        ${savings > 0 ? `<span class="gallery-card-badge">${formatDiscount(savings)}</span>` : ''}
        ${isFree ? `<span class="gallery-card-badge gallery-card-badge-free">FREE</span>` : ''}
      </div>
      <div class="gallery-card-body">
        <div class="gallery-card-store">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" />` : ''}
          <span>${storeName}</span>
          ${mcTier ? `<span class="deal-metacritic ${mcTier}">${metacritic}</span>` : ''}
        </div>
        <h3 class="gallery-card-title">${deal.title}</h3>
        <div class="gallery-card-footer">
          <div class="gallery-card-prices">
            <span class="gallery-card-price${isFree ? ' free' : ''}">${formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="gallery-card-original">${formatPrice(deal.normalPrice)}</span>` : ''}
          </div>
          <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="gallery-card-cta" onclick="event.stopPropagation()">
            View ${icons.externalLink}
          </a>
        </div>
      </div>
    `;

    // 3D tilt on mouse move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 12;
      const rotateY = (x - 0.5) * 12;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
    });

    // Click to open deal
    card.addEventListener('click', () => {
      window.open(dealLink, '_blank', 'noopener,noreferrer');
    });

    track.appendChild(card);
  });

  container.appendChild(sectionLabel);
  container.appendChild(sectionTitle);
  container.appendChild(track);

  // Drag to scroll
  initDragScroll(track);

  // Reveal animation
  setTimeout(() => {
    observeReveal(container.querySelectorAll('.reveal-item'));
  }, 100);
}

/**
 * Enable drag-to-scroll on the gallery track
 */
function initDragScroll(track) {
  let isDown = false;
  let startX;
  let scrollLeft;

  track.addEventListener('mousedown', (e) => {
    if (e.target.closest('a')) return;
    isDown = true;
    track.classList.add('dragging');
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });

  track.addEventListener('mouseleave', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  track.addEventListener('mouseup', () => {
    isDown = false;
    track.classList.remove('dragging');
  });

  track.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const walk = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - walk;
  });
}

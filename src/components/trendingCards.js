/* ============================================================
   Trending Cards — Layered 3D card grid with parallax
   Staggered layout with depth offsets and scroll animation.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount, metacriticTier } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { observeReveal, createScrollTrigger } from '../3d/scrollAnimator.js';

export async function initTrendingCards({ storesMap }) {
  const container = $('#trending-cards');
  if (!container) return;

  let deals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Metacritic',
      metacritic: 80,
      pageSize: 24,
      onSale: true,
    });
    deals = deduplicateDeals(raw).filter(d => d.steamAppID).slice(0, 8);
  } catch (err) {
    console.error('Trending cards fetch failed:', err);
    return;
  }

  if (deals.length === 0) {
    container.style.display = 'none';
    return;
  }

  renderTrendingCards(container, deals, storesMap);
}

function renderTrendingCards(container, deals, storesMap) {
  const sectionLabel = el('div', { class: 'section-label meta-label' }, 'Trending Now');
  const sectionTitle = el('h2', { class: 'section-title display-h1' });
  sectionTitle.innerHTML = 'Hot <span class="text-accent">Trending</span> Games';

  const grid = el('div', { class: 'trending-grid' });

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
    const metacritic = parseInt(deal.metacriticScore);
    const mcTier = metacriticTier(deal.metacriticScore);
    const inWishlist = isInWishlist(deal.dealID);

    const card = el('div', {
      class: `trending-card reveal-item${i < 2 ? ' trending-card-large' : ''}`,
      style: `--i: ${i}; --depth: ${(i % 3) * 10}px`,
      dataset: { dealId: deal.dealID },
    });

    card.innerHTML = `
      <div class="trending-card-image">
        <img src="${gameImg}" alt="${deal.title}" loading="lazy"
             onload="this.classList.add('loaded')" onerror="this.style.display='none'" />
        <div class="trending-card-image-overlay"></div>
        ${savings > 0 ? `<span class="trending-card-badge">${formatDiscount(savings)}</span>` : ''}
      </div>
      <div class="trending-card-body">
        <div class="trending-card-meta">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="trending-card-store-icon" />` : ''}
          <span class="meta-label">${storeName}</span>
          ${mcTier ? `<span class="deal-metacritic ${mcTier}">${metacritic}</span>` : ''}
        </div>
        <h3 class="trending-card-title">${deal.title}</h3>
        <div class="trending-card-footer">
          <div class="trending-card-prices">
            <span class="trending-card-price${isFree ? ' free' : ''}">${formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="trending-card-original">${formatPrice(deal.normalPrice)}</span>` : ''}
          </div>
          <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="trending-card-cta" onclick="event.stopPropagation()">
            View ${icons.externalLink}
          </a>
        </div>
      </div>
    `;

    // Wishlist button
    const wishlistBtn = el('button', {
      class: `trending-wishlist-btn${inWishlist ? ' active' : ''}`,
      'aria-label': 'Add to wishlist',
      html: icons.heart,
      onClick: (e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleWishlist(deal);
        wishlistBtn.classList.toggle('active');
      },
    });
    card.querySelector('.trending-card-image').appendChild(wishlistBtn);

    // Click to open
    card.addEventListener('click', () => {
      window.open(dealLink, '_blank', 'noopener,noreferrer');
    });

    // Subtle parallax on mouse move
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 6;
      const rotateY = (x - 0.5) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });

    grid.appendChild(card);
  });

  container.appendChild(sectionLabel);
  container.appendChild(sectionTitle);
  container.appendChild(grid);

  // Reveal
  setTimeout(() => {
    observeReveal(container.querySelectorAll('.reveal-item'));
  }, 100);
}

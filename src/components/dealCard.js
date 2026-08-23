/* ============================================================
   Deal Card Component
   ============================================================ */

import { el, lazyImage, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount, metacriticTier } from '../utils/format.js';
import { getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';

/**
 * Create a deal card DOM element
 * @param {Object} deal - CheapShark deal object
 * @param {Map} storesMap - Map of storeID → store object
 * @param {boolean} featured - Whether this is a featured (large) card
 * @param {number} index - Index for stagger animation delay
 */
export function createDealCard(deal, storesMap, featured = false, index = 0) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : '';
  const storeLogo = store ? getStoreLogo(store.images) : '';
  const gameImg = getGameImage(deal);
  const dealLink = getDealLink(deal.dealID);
  const inWishlist = isInWishlist(deal.dealID);
  const metacritic = parseInt(deal.metacriticScore);
  const mcTier = metacriticTier(deal.metacriticScore);

  // Stagger delay for animation
  const delay = Math.min(index * 60, 600);

  const card = el('div', {
    class: `deal-card${featured ? ' featured' : ''}`,
    style: `--delay: ${delay}ms`,
    dataset: { dealId: deal.dealID },
  });

  // Build card HTML
  card.innerHTML = `
    <div class="deal-card-image">
      <img src="${gameImg}" alt="${deal.title}" loading="lazy" onload="this.classList.add('loaded')" onerror="this.classList.add('loaded'); this.style.background='var(--color-skeleton)'" />
      ${savings > 0 ? `<span class="deal-discount-badge${savings >= 75 ? ' huge' : ''}">${formatDiscount(savings)}</span>` : ''}
      ${isFree ? '<span class="deal-free-badge">Free</span>' : ''}
    </div>
    <div class="deal-card-body">
      <div class="deal-card-store">
        ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" />` : ''}
        <span class="deal-card-store-name">${storeName}</span>
        ${mcTier ? `<span class="deal-metacritic ${mcTier}">${metacritic}</span>` : ''}
      </div>
      <h3 class="deal-card-title">${deal.title}</h3>
      <div class="deal-card-footer">
        <div class="deal-price-block">
          <span class="deal-price-current${isFree ? ' free' : ''}">${formatPrice(deal.salePrice)}</span>
          ${normalPrice > salePrice ? `<span class="deal-price-original">${formatPrice(deal.normalPrice)}</span>` : ''}
        </div>
        <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="deal-view-btn" onclick="event.stopPropagation()">
          View ${icons.externalLink}
        </a>
      </div>
    </div>
  `;

  // Wishlist button (on the image)
  const wishlistBtn = el('button', {
    class: `deal-wishlist-btn${inWishlist ? ' active' : ''}`,
    'aria-label': 'Add to wishlist',
    html: icons.heart,
    onClick: (e) => {
      e.stopPropagation();
      e.preventDefault();
      toggleWishlist(deal);
      wishlistBtn.classList.toggle('active');
      wishlistBtn.classList.add('popping');
      setTimeout(() => wishlistBtn.classList.remove('popping'), 400);
    },
  });

  card.querySelector('.deal-card-image').appendChild(wishlistBtn);

  // Card click → open deal
  card.addEventListener('click', () => {
    window.open(dealLink, '_blank', 'noopener,noreferrer');
  });

  return card;
}

/**
 * Create a skeleton placeholder card
 */
export function createSkeletonCard() {
  const card = el('div', { class: 'skeleton-card' });
  card.innerHTML = `
    <div class="skeleton-image"></div>
    <div class="skeleton-body">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line long"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line price"></div>
    </div>
  `;
  return card;
}

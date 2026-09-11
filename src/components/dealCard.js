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
  const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
  const dealLink = getDealLink(deal);
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

  // Image element with clean JS event listeners
  const imgEl = el('img', {
    src: gameImg || deal.thumb || '',
    alt: deal.title,
    loading: 'lazy',
  });

  const placeholderEl = el('div', { class: 'deal-image-placeholder' },
    el('div', { class: 'placeholder-content' },
      el('span', { class: 'placeholder-icon', html: '<svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="3"/><path d="M6 12h4m-2-2v4m9-2h.01m2.99 0h.01"/></svg>' }),
      el('span', { class: 'placeholder-title' }, deal.title)
    )
  );

  let triedHeader = false;
  let triedThumb = false;

  imgEl.addEventListener('load', () => {
    imgEl.classList.add('loaded');
  });

  imgEl.addEventListener('error', () => {
    if (!triedHeader && deal.steamAppID && imgEl.src.includes('header.jpg')) {
      triedHeader = true;
      imgEl.src = `https://cdn.cloudflare.steamstatic.com/steam/apps/${deal.steamAppID}/capsule_616x353.jpg`;
    } else if (!triedThumb && deal.thumb && imgEl.src !== deal.thumb) {
      triedThumb = true;
      imgEl.src = deal.thumb;
    } else {
      imgEl.style.display = 'none';
    }
  });

  if (!gameImg && !deal.thumb) {
    imgEl.style.display = 'none';
  }

  // Build card image container (placeholder background layer + image layer on top)
  const imageContainer = el('div', { class: 'deal-card-image' },
    placeholderEl,
    imgEl,
    savings > 0 ? el('span', { class: `deal-discount-badge${savings >= 75 ? ' huge' : ''}` }, formatDiscount(savings)) : null,
    isFree ? el('span', { class: 'deal-free-badge' }, 'Free') : null
  );

  // Card body HTML
  const bodyContainer = el('div', { class: 'deal-card-body' });
  bodyContainer.innerHTML = `
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
  `;

  // Wishlist button
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

  imageContainer.appendChild(wishlistBtn);

  card.appendChild(imageContainer);
  card.appendChild(bodyContainer);

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

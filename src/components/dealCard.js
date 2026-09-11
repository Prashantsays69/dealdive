/* ============================================================
   Deal Card Component — Denmu Editorial Catalog Card
   ============================================================ */

import { el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { openGameDetail } from './gameDetailModal.js';

/**
 * Create a deal card DOM element
 */
export function createDealCard(deal, storesMap, featured = false, index = 0) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWishlist = isInWishlist(deal.dealID);
  const score = deal.metacriticScore && deal.metacriticScore !== '0' ? deal.metacriticScore : null;

  const card = el('div', {
    class: 'denmu-catalog-card',
    dataset: { dealId: deal.dealID },
  });

  // Media
  const mediaWrap = el('div', { class: 'catalog-card-media' });
  const imgEl = el('img', {
    src: gameImg || deal.thumb || '',
    alt: deal.title,
    loading: 'lazy',
  });

  imgEl.addEventListener('load', () => imgEl.classList.add('loaded'));
  imgEl.addEventListener('error', () => {
    if (deal.thumb && imgEl.src !== deal.thumb) {
      imgEl.src = deal.thumb;
    }
  });

  mediaWrap.appendChild(imgEl);

  if (savings > 0) {
    const badge = el('span', { class: 'catalog-discount-badge' }, `-${savings}%`);
    mediaWrap.appendChild(badge);
  }

  // Wishlist button on image
  const wishBtn = el('button', {
    type: 'button',
    class: `catalog-card-wish${inWishlist ? ' active' : ''}`,
    'aria-label': 'Wishlist',
    html: icons.heart,
    onClick: (e) => {
      e.stopPropagation();
      toggleWishlist(deal);
      wishBtn.classList.toggle('active');
    },
  });
  mediaWrap.appendChild(wishBtn);

  // Body
  const bodyEl = el('div', { class: 'catalog-card-body' });
  bodyEl.innerHTML = `
    <div class="catalog-card-meta meta-label">
      <span class="catalog-card-store">
        ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon-sm" />` : ''}
        ${storeName}
      </span>
      ${score ? `<span class="catalog-card-score meta-label">MC ${score}</span>` : ''}
    </div>

    <h4 class="catalog-card-title">${deal.title}</h4>

    <div class="catalog-card-foot">
      <div class="catalog-card-prices">
        <span class="catalog-price-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
        ${normalPrice > salePrice ? `<span class="catalog-price-orig mono">${formatPrice(deal.normalPrice)}</span>` : ''}
      </div>

      <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="catalog-cta-btn" title="Get Deal" onclick="event.stopPropagation()">
        GET DEAL
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
      </a>
    </div>
  `;

  card.appendChild(mediaWrap);
  card.appendChild(bodyEl);

  // Click card opens Game Detail Modal
  card.addEventListener('click', () => {
    openGameDetail(deal);
  });

  return card;
}

export function createSkeletonCard() {
  const card = el('div', { class: 'denmu-catalog-card skeleton' });
  card.innerHTML = `
    <div class="catalog-card-media"><div class="skeleton-shimmer"></div></div>
    <div class="catalog-card-body">
      <div class="skeleton-line short"></div>
      <div class="skeleton-line title"></div>
      <div class="skeleton-line price"></div>
    </div>
  `;
  return card;
}

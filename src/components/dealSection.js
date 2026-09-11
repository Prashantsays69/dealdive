/* ============================================================
   Deal Sections — AMIX-Inspired 3D Viewport Scenes
   Each deal occupies approximately one viewport with a dedicated
   3D composition and crisp editorial metadata UI.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { fetchHeroDeals, fetchDeals, deduplicateDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { buildDealComposition, isWebGLEnabled } from '../3d/scene3d.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';

export async function initDealSections({ storesMap }) {
  let deals = [];

  try {
    // Fetch top deals
    const heroDeals = await fetchHeroDeals();
    if (heroDeals && heroDeals.length >= 4) {
      deals = heroDeals.slice(0, 4);
    } else {
      const allDeals = await fetchDeals({
        pageSize: 30,
        sortBy: 'Deal Rating',
        onSale: true,
      });
      deals = deduplicateDeals(allDeals).slice(0, 4);
    }
  } catch (err) {
    console.error('Failed to fetch deals for deal sections:', err);
    return;
  }

  deals.forEach((deal, idx) => {
    const sectionId = `deal-0${idx + 1}`;
    const sectionEl = document.getElementById(sectionId);
    if (!sectionEl) return;

    renderDealSection(sectionEl, deal, idx, storesMap);

    // Build 3D composition for this deal
    if (isWebGLEnabled()) {
      const imgUrl = getHeroImage(deal) || getGameImage(deal);
      buildDealComposition(deal, idx, imgUrl);
    }
  });
}

function renderDealSection(sectionEl, deal, index, storesMap) {
  const side = index % 2 === 0 ? 'left' : 'right';
  const dealNumber = `0${index + 1}`;
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;

  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : (deal.storeID === '1' ? 'Steam' : 'Epic Games');
  const storeLogo = getStoreLogo(deal.storeID);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);
  const metacritic = deal.metacriticScore && deal.metacriticScore !== '0' ? deal.metacriticScore : null;

  sectionEl.classList.add(`deal-align-${side}`);

  sectionEl.innerHTML = `
    <div class="deal-card deal-card-${side}">
      <div class="deal-header-meta">
        <span class="deal-badge meta-label">DEAL ${dealNumber} // FEATURED DROP</span>
        <span class="deal-store-pill meta-label">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="deal-store-icon" />` : ''}
          ${storeName}
        </span>
      </div>

      <h2 class="deal-game-title">${deal.title}</h2>

      <div class="deal-editorial-grid">
        <div class="deal-meta-cell">
          <span class="deal-meta-title meta-label">DISCOUNT</span>
          <span class="deal-meta-val deal-discount-badge">-${savings}%</span>
        </div>

        <div class="deal-meta-cell">
          <span class="deal-meta-title meta-label">CURRENT PRICE</span>
          <span class="deal-meta-val deal-sale-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
        </div>

        <div class="deal-meta-cell">
          <span class="deal-meta-title meta-label">ORIGINAL PRICE</span>
          <span class="deal-meta-val deal-normal-price mono">${formatPrice(deal.normalPrice)}</span>
        </div>

        ${metacritic ? `
          <div class="deal-meta-cell">
            <span class="deal-meta-title meta-label">METACRITIC</span>
            <span class="deal-meta-val deal-meta-score mono">${metacritic} / 100</span>
          </div>
        ` : ''}
      </div>

      <div class="deal-card-actions">
        <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="deal-action-btn deal-btn-primary">
          <span>GET DEAL</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </a>

        <button type="button" class="deal-action-btn deal-btn-wishlist ${inWish ? 'in-wishlist' : ''}" data-deal-id="${deal.dealID}" aria-label="Bookmark to wishlist">
          ${icons.heart}
          <span class="wishlist-btn-text">${inWish ? 'SAVED' : 'WISHLIST'}</span>
        </button>
      </div>
    </div>
  `;

  // Attach Wishlist handler
  const wishBtn = sectionEl.querySelector('.deal-btn-wishlist');
  if (wishBtn) {
    wishBtn.addEventListener('click', () => {
      const added = toggleWishlist(deal);
      wishBtn.classList.toggle('in-wishlist', added);
      const text = wishBtn.querySelector('.wishlist-btn-text');
      if (text) text.textContent = added ? 'SAVED' : 'WISHLIST';
    });
  }
}

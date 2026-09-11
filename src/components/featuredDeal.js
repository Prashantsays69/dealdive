/* ============================================================
   Featured Deals — Denmu Asymmetric Editorial Compositions
   Large widescreen compositions, oversized titles, tiny metadata,
   deal pricing breakdown, GET DEAL buttons, and detail modal.
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchHeroDeals, fetchDeals, deduplicateDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { openGameDetail } from './gameDetailModal.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

export async function initFeaturedDeal({ storesMap }) {
  const container = $('#featured');
  if (!container) return;

  renderSkeleton(container);

  try {
    let rawDeals = [];
    const heroDeals = await fetchHeroDeals();
    if (heroDeals && heroDeals.length >= 3) {
      rawDeals = heroDeals.slice(0, 3);
    } else {
      const allDeals = await fetchDeals({ pageSize: 20, sortBy: 'Deal Rating', onSale: true });
      rawDeals = deduplicateDeals(allDeals).slice(0, 3);
    }

    if (!rawDeals.length) return;

    // Enrich top 3 featured titles with RAWG
    const deals = await enrichDealsWithRAWG(rawDeals, 3);
    renderDenmuEditorialFeatured(container, deals, storesMap);
  } catch (err) {
    console.error('Featured deals fetch error:', err);
  }
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="denmu-featured-inner">
      <div class="denmu-section-header">
        <span class="meta-label">01 // EDITORIAL CURATION</span>
        <h2 class="denmu-section-title">Featured Selections</h2>
      </div>
      <div class="denmu-featured-skeleton">
        <div class="skeleton-block"></div>
      </div>
    </div>
  `;
}

function renderDenmuEditorialFeatured(container, deals, storesMap) {
  const leadDeal = deals[0];
  const sideDeals = deals.slice(1, 3);

  container.innerHTML = `
    <div class="denmu-featured-inner">
      <div class="denmu-section-header">
        <div class="meta-label">01 // EDITORIAL CURATION</div>
        <h2 class="denmu-section-title">Featured Selections</h2>
        <p class="denmu-section-sub">
          Handpicked historic discounts on critically acclaimed masterpieces.
        </p>
      </div>

      <!-- Marquee Widescreen Composition 01 (Denmu Lead Feature) -->
      ${leadDeal ? renderMarqueeFeature(leadDeal, storesMap) : ''}

      <!-- Asymmetric Editorial Split (Games 02 & 03) -->
      ${sideDeals.length > 0 ? `
        <div class="denmu-editorial-split-row">
          ${sideDeals.map((deal, idx) => renderSplitFeature(deal, storesMap, idx + 2)).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Attach card click handlers to open Game Detail modal
  container.querySelectorAll('.denmu-composition-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const dealId = card.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) openGameDetail(targetDeal);
    });
  });

  // Attach wishlist buttons
  container.querySelectorAll('.composition-wish-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const dealId = btn.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) {
        const added = toggleWishlist(targetDeal);
        btn.classList.toggle('active', added);
      }
    });
  });
}

function renderMarqueeFeature(deal, storesMap) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getHeroImage(deal) || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);
  const genre = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'RPG';
  const score = deal.metacriticScore && deal.metacriticScore !== '0' ? deal.metacriticScore : (deal.rawgRating ? (deal.rawgRating * 20).toFixed(0) : '96');
  const releaseYear = deal.rawg?.released ? deal.rawg.released.split('-')[0] : '2023';

  return `
    <div class="denmu-composition-card denmu-marquee-feature" data-deal-id="${deal.dealID}">
      <div class="marquee-media-wrap">
        <img src="${gameImg}" alt="${deal.title}" class="marquee-img" loading="lazy" />
        <div class="marquee-vignette"></div>

        <div class="marquee-floating-badges">
          <span class="meta-label badge-pill">${genre} // METACRITIC ${score}</span>
          <span class="badge-discount">-${savings}%</span>
        </div>
      </div>

      <div class="marquee-content">
        <div class="marquee-meta-top meta-label">
          <span class="marquee-store">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon-sm" />` : ''}
            ${storeName} STORE // ${releaseYear}
          </span>
          <span class="marquee-drop-tag text-accent">TOP EDITORIAL PICK</span>
        </div>

        <h3 class="marquee-title">${deal.title}</h3>

        <p class="marquee-desc">
          ${deal.description ? deal.description.slice(0, 200) + '...' : 'Available at an unprecedented discount. Track price history and multi-store records.'}
        </p>

        <div class="marquee-pricing-row">
          <div class="marquee-prices">
            <span class="marquee-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="marquee-normal mono">${formatPrice(deal.normalPrice)}</span>` : ''}
            <span class="marquee-savings meta-label">SAVE ${formatPrice(normalPrice - salePrice)}</span>
          </div>

          <div class="marquee-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="marquee-cta-btn" onclick="event.stopPropagation()">
              GET DEAL
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <button type="button" class="composition-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSplitFeature(deal, storesMap, number) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getHeroImage(deal) || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);
  const genre = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'ACTION';

  return `
    <div class="denmu-composition-card denmu-split-card" data-deal-id="${deal.dealID}">
      <div class="split-media-wrap">
        <img src="${gameImg}" alt="${deal.title}" class="split-img" loading="lazy" />
        <div class="split-vignette"></div>
        <span class="split-discount-badge">-${savings}%</span>
      </div>

      <div class="split-content">
        <div class="split-meta-row meta-label">
          <span class="split-store">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon-sm" />` : ''}
            ${storeName}
          </span>
          <span>// ${genre}</span>
        </div>

        <h4 class="split-title">${deal.title}</h4>

        <div class="split-foot">
          <div class="split-prices">
            <span class="split-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="split-normal mono">${formatPrice(deal.normalPrice)}</span>` : ''}
          </div>

          <div class="split-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="split-cta-btn" onclick="event.stopPropagation()">
              GET DEAL
            </a>
            <button type="button" class="composition-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

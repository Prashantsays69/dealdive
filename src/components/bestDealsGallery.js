/* ============================================================
   Best Deals Gallery — Denmu Asymmetric Editorial Grid
   1 large card (67% width) + 2 stacked cards (33% width)
   Deep discounts (>50% off), RAWG artwork zoom on hover,
   Steam review / Deal Rating indicators, direct GET DEAL links,
   and interactive Game Detail Modal.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { openGameDetail } from './gameDetailModal.js';

export async function initBestDealsGallery({ storesMap }) {
  const container = $('#best-deals');
  if (!container) return;

  renderSkeleton(container);

  let rawDeals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Savings',
      pageSize: 30,
      onSale: true,
      storeID: '1,25,7,11',
    });
    // Filter to >50% discount and valid Steam app IDs
    rawDeals = deduplicateDeals(raw)
      .filter(d => parseFloat(d.savings) >= 50 && d.steamAppID)
      .slice(0, 6);
  } catch (err) {
    console.error('Best deals fetch failed:', err);
    return;
  }

  if (rawDeals.length === 0) return;

  // Enrich with RAWG
  const deals = await enrichDealsWithRAWG(rawDeals, 4);

  renderAsymmetricGrid(container, deals, storesMap);
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="best-deals-inner">
      <div class="best-deals-header">
        <div class="meta-label">03 // CURATED BARGAINS</div>
        <h2 class="best-deals-title">Best Deals Right Now</h2>
        <p class="best-deals-desc">Deep discounts exceeding 50% across verified PC storefronts.</p>
      </div>
      <div class="best-deals-skeleton-grid">
        <div class="skeleton-card large"><div class="skeleton-shimmer"></div></div>
        <div class="skeleton-stack">
          <div class="skeleton-card small"><div class="skeleton-shimmer"></div></div>
          <div class="skeleton-card small"><div class="skeleton-shimmer"></div></div>
        </div>
      </div>
    </div>
  `;
}

function renderAsymmetricGrid(container, deals, storesMap) {
  const leadDeal = deals[0];
  const sideDeals = deals.slice(1, 3);
  const rowDeals = deals.slice(3, 6);

  container.innerHTML = `
    <div class="best-deals-inner">
      <div class="best-deals-header">
        <div class="meta-label">03 // CURATED BARGAINS</div>
        <h2 class="best-deals-title">Best Deals Right Now</h2>
        <p class="best-deals-desc">Deep discounts exceeding 50% off with outstanding community ratings.</p>
      </div>

      <!-- Denmu Asymmetric Trio: 67% Large Lead Card + 33% Stacked Cards -->
      <div class="denmu-deals-asymmetric-wrap">
        ${leadDeal ? renderLeadCard(leadDeal, storesMap) : ''}
        
        <div class="denmu-deals-stack">
          ${sideDeals.map((deal, idx) => renderCompactCard(deal, storesMap, idx + 1)).join('')}
        </div>
      </div>

      <!-- Secondary complementary row -->
      ${rowDeals.length > 0 ? `
        <div class="denmu-deals-subrow">
          ${rowDeals.map((deal, idx) => renderSubCard(deal, storesMap, idx + 3)).join('')}
        </div>
      ` : ''}
    </div>
  `;

  // Attach card click handlers to open Game Detail modal
  container.querySelectorAll('.denmu-deal-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const dealId = card.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) {
        openGameDetail(targetDeal);
      }
    });
  });

  // Attach wishlist button handlers
  container.querySelectorAll('.deal-card-wish-btn').forEach((btn) => {
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

function renderLeadCard(deal, storesMap) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);
  const rating = deal.rawgRating ? `★ ${deal.rawgRating.toFixed(1)}` : (deal.metacriticScore ? `${deal.metacriticScore}/100` : '9.8 RATING');

  return `
    <div class="denmu-deal-card denmu-deal-large" data-deal-id="${deal.dealID}">
      <div class="denmu-deal-media">
        <img src="${gameImg}" alt="${deal.title}" class="denmu-deal-img" loading="lazy" />
        <div class="denmu-deal-overlay"></div>
        <div class="denmu-deal-badges-top">
          <span class="denmu-deal-badge-context meta-label">STEAL OF THE WEEK</span>
          <span class="denmu-deal-badge-discount">-${savings}%</span>
        </div>
      </div>

      <div class="denmu-deal-content">
        <div class="denmu-deal-meta-header">
          <div class="denmu-deal-store">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon" />` : ''}
            <span class="meta-label">${storeName}</span>
          </div>
          <span class="denmu-deal-score meta-label">${rating}</span>
        </div>

        <h3 class="denmu-deal-headline">${deal.title}</h3>

        <div class="denmu-deal-footer-bar">
          <div class="denmu-deal-price-block">
            <span class="denmu-deal-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="denmu-deal-normal mono">${formatPrice(deal.normalPrice)}</span>` : ''}
          </div>

          <div class="denmu-deal-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="denmu-deal-cta-btn" title="Direct store deal" onclick="event.stopPropagation()">
              <span>GET DEAL</span>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </a>
            <button type="button" class="deal-card-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCompactCard(deal, storesMap, idx) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);

  return `
    <div class="denmu-deal-card denmu-deal-compact" data-deal-id="${deal.dealID}">
      <div class="denmu-compact-media">
        <img src="${gameImg}" alt="${deal.title}" class="denmu-deal-img" loading="lazy" />
        <span class="denmu-deal-badge-discount compact">-${savings}%</span>
      </div>

      <div class="denmu-compact-content">
        <div class="denmu-deal-store">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon" />` : ''}
          <span class="meta-label">${storeName}</span>
        </div>

        <h4 class="denmu-compact-title">${deal.title}</h4>

        <div class="denmu-compact-foot">
          <div class="denmu-deal-price-block">
            <span class="denmu-deal-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            <span class="denmu-deal-normal mono">${formatPrice(deal.normalPrice)}</span>
          </div>

          <div class="denmu-compact-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="denmu-deal-cta-btn compact" title="Direct store deal" onclick="event.stopPropagation()">
              GET DEAL
            </a>
            <button type="button" class="deal-card-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSubCard(deal, storesMap, idx) {
  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);

  return `
    <div class="denmu-deal-card denmu-deal-sub" data-deal-id="${deal.dealID}">
      <div class="denmu-deal-media sub">
        <img src="${gameImg}" alt="${deal.title}" class="denmu-deal-img" loading="lazy" />
        <span class="denmu-deal-badge-discount">-${savings}%</span>
      </div>

      <div class="denmu-deal-content">
        <div class="denmu-deal-store">
          ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon" />` : ''}
          <span class="meta-label">${storeName}</span>
        </div>

        <h4 class="denmu-sub-title">${deal.title}</h4>

        <div class="denmu-deal-footer-bar">
          <div class="denmu-deal-price-block">
            <span class="denmu-deal-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            <span class="denmu-deal-normal mono">${formatPrice(deal.normalPrice)}</span>
          </div>

          <div class="denmu-compact-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="denmu-deal-cta-btn compact" title="Direct store deal" onclick="event.stopPropagation()">
              GET DEAL
            </a>
            <button type="button" class="deal-card-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

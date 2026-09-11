/* ============================================================
   Best Deals Gallery — 04 BEST DEALS
   Curated high-rating bargains with RAWG imagery,
   contextual deal tags, and interactive Game Detail modal.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount, metacriticTier } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { openGameDetail } from './gameDetailModal.js';

export async function initBestDealsGallery({ storesMap }) {
  const container = $('#best-deals');
  if (!container) return;

  let rawDeals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Deal Rating',
      pageSize: 24,
      onSale: true,
      storeID: '1,25,7',
    });
    rawDeals = deduplicateDeals(raw).filter(d => d.steamAppID).slice(0, 8);
  } catch (err) {
    console.error('Best deals fetch failed:', err);
    return;
  }

  if (rawDeals.length === 0) return;

  // Enrich with RAWG
  const deals = await enrichDealsWithRAWG(rawDeals, 4);

  renderGallery(container, deals, storesMap);
}

function renderGallery(container, deals, storesMap) {
  container.innerHTML = `
    <div class="best-deals-inner">
      <div class="best-deals-header">
        <div class="meta-label">04 // CURATED BARGAINS</div>
        <h2 class="best-deals-title">Best Deals Right Now</h2>
        <p class="best-deals-desc">
          Top-rated titles verified with historic low pricing and peak discount ratings.
        </p>
      </div>

      <div class="best-deals-grid">
        ${deals.map((deal, i) => {
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

          // Contextual deal tag: BEST PRICE, LOWEST EVER, NEW DEAL
          let contextualBadge = 'BEST PRICE';
          if (savings >= 80) contextualBadge = 'LOWEST EVER';
          else if (parseFloat(deal.dealRating) >= 9.5) contextualBadge = 'TOP DEAL';
          else if (i === 0 || i === 1) contextualBadge = 'NEW DEAL';

          return `
            <div class="best-deal-card" style="--card-i: ${i}" data-deal-id="${deal.dealID}">
              <div class="best-deal-media">
                <img src="${gameImg}" alt="${deal.title}" loading="lazy" />
                <div class="best-deal-tags">
                  <span class="best-deal-tag-context meta-label">${contextualBadge}</span>
                  <span class="best-deal-tag-discount">-${savings}%</span>
                </div>
              </div>

              <div class="best-deal-body">
                <div class="best-deal-meta-top">
                  <div class="best-deal-store">
                    ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon" />` : ''}
                    <span class="meta-label">${storeName}</span>
                  </div>
                  ${deal.rawgRating ? `<span class="rawg-score-badge mono">★ ${deal.rawgRating.toFixed(1)}</span>` : ''}
                </div>

                <h3 class="best-deal-title">${deal.title}</h3>

                <div class="best-deal-footer">
                  <div class="best-deal-prices">
                    <span class="best-deal-sale-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
                    ${normalPrice > salePrice ? `<span class="best-deal-orig-price mono">${formatPrice(deal.normalPrice)}</span>` : ''}
                  </div>

                  <div class="best-deal-actions">
                    <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="best-deal-buy-btn" title="Direct store link" onclick="event.stopPropagation()">
                      GET DEAL
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                    <button type="button" class="best-deal-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
                      ${icons.heart}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach card click to open Game Detail modal
  container.querySelectorAll('.best-deal-card').forEach((card) => {
    card.addEventListener('click', () => {
      const dealId = card.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) {
        openGameDetail(targetDeal);
      }
    });

    // 3D Tilt interaction
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - y) * 10;
      const rotY = (x - 0.5) * 10;
      card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0)';
    });
  });

  // Attach wishlist button handlers
  container.querySelectorAll('.best-deal-wish-btn').forEach((btn) => {
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

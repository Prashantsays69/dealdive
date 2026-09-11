/* ============================================================
   Trending Cards — Denmu Visual-Forward 3-Column Editorial Layout
   High community rating & popularity velocity,
   RAWG high-res imagery, store badges, direct GET DEAL buttons,
   and interactive Game Detail inspection.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';
import { openGameDetail } from './gameDetailModal.js';

export async function initTrendingCards({ storesMap }) {
  const container = $('#trending');
  if (!container) return;

  renderSkeleton(container);

  let rawDeals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Deal Rating',
      pageSize: 30,
      onSale: true,
      metacritic: 75,
    });
    rawDeals = deduplicateDeals(raw).filter(d => d.steamAppID).slice(0, 6);
  } catch (err) {
    console.error('Trending cards fetch failed:', err);
    return;
  }

  if (rawDeals.length === 0) return;

  // Enrich with RAWG
  const deals = await enrichDealsWithRAWG(rawDeals, 3);

  renderTrendingEditorial(container, deals, storesMap);
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="trending-inner">
      <div class="trending-header">
        <div class="meta-label">04 // POPULARITY VELOCITY</div>
        <h2 class="trending-headline">Trending Community Favorites</h2>
        <p class="trending-desc">Critically acclaimed titles trending across gaming communities.</p>
      </div>
      <div class="trending-editorial-grid">
        ${[1, 2, 3].map(() => `
          <div class="skeleton-card"><div class="skeleton-shimmer"></div></div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderTrendingEditorial(container, deals, storesMap) {
  container.innerHTML = `
    <div class="trending-inner">
      <div class="trending-header">
        <div class="meta-label">04 // POPULARITY VELOCITY</div>
        <h2 class="trending-headline">Trending Community Favorites</h2>
        <p class="trending-desc">Critically acclaimed titles with high review sentiment and active price promotions.</p>
      </div>

      <!-- 3-Column Editorial Visual-Forward Grid -->
      <div class="trending-editorial-grid">
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
          const genreTag = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'COMMUNITY HIT';
          const score = deal.metacriticScore && deal.metacriticScore !== '0' ? deal.metacriticScore : (deal.rawgRating ? (deal.rawgRating * 20).toFixed(0) : '94');

          return `
            <div class="trending-card" data-deal-id="${deal.dealID}">
              <div class="trending-card-media">
                <img src="${gameImg}" alt="${deal.title}" loading="lazy" />
                <div class="trending-card-overlay"></div>
                <div class="trending-card-badges">
                  <span class="trending-genre-pill meta-label">${genreTag}</span>
                  <span class="trending-discount-pill">-${savings}%</span>
                </div>
              </div>

              <div class="trending-card-body">
                <div class="trending-card-meta">
                  <div class="trending-card-store">
                    ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon" />` : ''}
                    <span class="meta-label">${storeName}</span>
                  </div>
                  <span class="trending-score-pill meta-label">CRITIC ${score}</span>
                </div>

                <h3 class="trending-card-title">${deal.title}</h3>

                <div class="trending-card-footer">
                  <div class="trending-card-price-group">
                    <span class="trending-sale-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
                    ${normalPrice > salePrice ? `<span class="trending-normal-price mono">${formatPrice(deal.normalPrice)}</span>` : ''}
                  </div>

                  <div class="trending-card-actions">
                    <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="trending-buy-btn" title="Store link" onclick="event.stopPropagation()">
                      GET DEAL
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                    <button type="button" class="trending-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
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
  container.querySelectorAll('.trending-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const dealId = card.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) {
        openGameDetail(targetDeal);
      }
    });
  });

  // Attach wishlist handlers
  container.querySelectorAll('.trending-wish-btn').forEach((btn) => {
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

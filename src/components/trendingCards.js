/* ============================================================
   Trending Cards — AMIX Layered 3D Showcase (RAWG Enriched)
   High-velocity discounted games with RAWG artwork & tags.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';

export async function initTrendingCards({ storesMap }) {
  const container = $('#trending');
  if (!container) return;

  let rawDeals = [];
  try {
    const raw = await fetchDeals({
      sortBy: 'Savings',
      pageSize: 30,
      onSale: true,
      metacritic: 70,
    });
    rawDeals = deduplicateDeals(raw).filter(d => d.steamAppID).slice(0, 6);
  } catch (err) {
    console.error('Trending cards fetch failed:', err);
    return;
  }

  if (rawDeals.length === 0) return;

  // Enrich with RAWG
  const deals = await enrichDealsWithRAWG(rawDeals, 3);

  container.innerHTML = `
    <div class="trending-inner">
      <div class="trending-header">
        <div class="meta-label">TRENDING NOW // DISCOUNT VELOCITY</div>
        <h2 class="trending-headline">Layered Deals</h2>
        <p class="trending-desc">High-rated titles experiencing major price drops across official storefronts.</p>
      </div>

      <div class="trending-cards-deck">
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
          const genreTag = deal.genres && deal.genres.length > 0 ? deal.genres[0] : null;

          return `
            <div class="amix-trending-card" style="--card-index: ${i}">
              <div class="amix-card-media">
                <img src="${gameImg}" alt="${deal.title}" loading="lazy" />
                <span class="amix-card-badge">-${savings}%</span>
                ${genreTag ? `<span class="amix-card-genre meta-label">${genreTag}</span>` : ''}
              </div>
              <div class="amix-card-content">
                <div class="amix-card-meta">
                  <span class="meta-label">${storeName}</span>
                  <span class="amix-card-original mono">${formatPrice(deal.normalPrice)}</span>
                </div>
                <h3 class="amix-card-title">${deal.title}</h3>
                <div class="amix-card-bottom">
                  <span class="amix-card-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
                  <div class="amix-card-btns">
                    <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="amix-card-cta" title="Store link">
                      GET DEAL
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                    </a>
                    <button type="button" class="amix-card-wish ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist">
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

  // Attach wishlist click listeners
  container.querySelectorAll('.amix-card-wish').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const dealId = btn.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) {
        const added = toggleWishlist(targetDeal);
        btn.classList.toggle('active', added);
      }
    });
  });
}

/* ============================================================
   Featured Deal Component — Denmu Massive Editorial Showcase
   67% visual ratio, oversized display typography,
   genre & metacritic tags, brand accent pricing,
   direct GET DEAL CTA + View Details modal trigger.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchHeroDeals, fetchDeals, deduplicateDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { openGameDetail } from './gameDetailModal.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

export async function initFeaturedDeal({ storesMap }) {
  const container = $('#featured-deal');
  if (!container) return;

  renderSkeleton(container);

  try {
    let topDeal = null;
    const heroDeals = await fetchHeroDeals();
    if (heroDeals && heroDeals.length > 0) {
      topDeal = heroDeals[0];
    } else {
      const deals = await fetchDeals({ pageSize: 10, sortBy: 'Deal Rating', onSale: true });
      topDeal = deduplicateDeals(deals)[0];
    }

    if (!topDeal) return;

    // Enrich top deal with RAWG
    const enriched = await enrichDealsWithRAWG([topDeal], 1);
    const deal = enriched[0] || topDeal;

    renderFeaturedDeal(container, deal, storesMap);
  } catch (err) {
    console.error('Failed to init featured deal:', err);
  }
}

function renderSkeleton(container) {
  container.innerHTML = `
    <div class="featured-editorial-inner">
      <div class="featured-editorial-header">
        <div class="meta-label">02 // EDITORIAL SPOTLIGHT</div>
        <h2 class="featured-editorial-headline">Featured Deal of the Day</h2>
      </div>
      <div class="featured-editorial-card skeleton-card">
        <div class="skeleton-shimmer"></div>
      </div>
    </div>
  `;
}

function renderFeaturedDeal(container, deal, storesMap) {
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
  const metacritic = deal.metacriticScore && deal.metacriticScore !== '0' ? deal.metacriticScore : null;
  const rawgRating = deal.rawgRating ? Number(deal.rawgRating).toFixed(1) : null;
  const primaryGenre = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'ACTION';
  const savingsAmount = normalPrice - salePrice;

  container.innerHTML = `
    <div class="featured-editorial-inner">
      <div class="featured-editorial-header">
        <div class="meta-label">02 // EDITORIAL SPOTLIGHT</div>
        <h2 class="featured-editorial-headline">Featured Deal of the Day</h2>
        <p class="featured-editorial-sub">A marquee title available at its steepest historic discount window.</p>
      </div>

      <!-- Denmu 67% width hero card layout -->
      <div class="featured-editorial-card" id="featured-editorial-card" data-deal-id="${deal.dealID}">
        <!-- Visual ratio 67% -->
        <div class="featured-card-media">
          <img src="${gameImg}" alt="${deal.title}" class="featured-card-img" />
          <div class="featured-card-gradient"></div>
          
          <div class="featured-card-tags-overlay">
            <span class="featured-genre-pill meta-label">${primaryGenre}</span>
            ${metacritic ? `<span class="featured-meta-pill meta-label">METACRITIC ${metacritic}</span>` : ''}
            ${rawgRating ? `<span class="featured-rawg-pill meta-label">RAWG ★ ${rawgRating}</span>` : ''}
          </div>
        </div>

        <!-- Content details -->
        <div class="featured-card-body">
          <div class="featured-card-store">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="featured-store-icon" />` : ''}
            <span class="meta-label">${storeName.toUpperCase()} VERIFIED SALE</span>
          </div>

          <h3 class="featured-card-title">${deal.title}</h3>

          <p class="featured-card-description">
            ${deal.description ? deal.description.slice(0, 180) + '...' : 'Special promotional rate available for a limited window. Compare with historical pricing and multi-store records.'}
          </p>

          <!-- Pricing block -->
          <div class="featured-pricing-block">
            <div class="featured-pricing-top">
              <span class="featured-discount-badge">-${savings}%</span>
              <div class="featured-price-group">
                <span class="featured-sale-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
                ${normalPrice > salePrice ? `<span class="featured-normal-price mono">${formatPrice(deal.normalPrice)}</span>` : ''}
              </div>
            </div>
            <div class="featured-savings-line meta-label">
              TOTAL SAVINGS: <strong class="text-accent">${formatPrice(savingsAmount)} OFF</strong>
            </div>
          </div>

          <!-- CTAs -->
          <div class="featured-card-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="featured-btn-primary" title="Buy directly on store">
              <span>GET DEAL</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>

            <button type="button" class="featured-btn-secondary" id="featured-view-details-btn">
              <span>VIEW DETAILS</span>
            </button>

            <button type="button" class="featured-btn-wishlist ${inWish ? 'active' : ''}" id="featured-wish-btn" aria-label="Bookmark to wishlist">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach handlers
  const card = $('#featured-editorial-card');
  const detailsBtn = $('#featured-view-details-btn');
  const wishBtn = $('#featured-wish-btn');

  const openDetails = () => openGameDetail(deal);

  card?.addEventListener('click', (e) => {
    // If click was on a link or button, don't trigger modal
    if (e.target.closest('a') || e.target.closest('button')) return;
    openDetails();
  });

  detailsBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    openDetails();
  });

  wishBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const added = toggleWishlist(deal);
    wishBtn.classList.toggle('active', added);
  });
}

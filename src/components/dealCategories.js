/* ============================================================
   Deal Categories — Horizontal Editorial Sections
   Best Deals / Trending / Lowest Price / Biggest Discount / New Deals
   Horizontal editorial carousel with high-res artwork,
   oversized titles, tiny metadata, and direct deal links.
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchDeals, deduplicateDeals, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { openGameDetail } from './gameDetailModal.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

const CATEGORIES = [
  { id: 'best-deals', label: 'Best Deals', params: { sortBy: 'Deal Rating', onSale: true, pageSize: 12 } },
  { id: 'trending', label: 'Trending', params: { sortBy: 'Metacritic', metacritic: 75, onSale: true, pageSize: 12 } },
  { id: 'lowest-price', label: 'Lowest Price', params: { sortBy: 'Price', upperPrice: 5, onSale: true, pageSize: 12 } },
  { id: 'biggest-discount', label: 'Biggest Discount', params: { sortBy: 'Savings', onSale: true, pageSize: 12 } },
  { id: 'new-deals', label: 'New Deals', params: { sortBy: 'Release', onSale: true, pageSize: 12 } },
];

let activeCatId = 'best-deals';
let cachedData = new Map();
let currentStoresMap = new Map();

export async function initDealCategories({ storesMap }) {
  const container = $('#categories');
  if (!container) return;

  currentStoresMap = storesMap || new Map();
  renderCategoryLayout(container);
  loadCategoryContent(activeCatId);
}

function renderCategoryLayout(container) {
  container.innerHTML = `
    <div class="denmu-categories-inner">
      <div class="denmu-categories-top">
        <div>
          <span class="meta-label">02 // CURATED STREAMS</span>
          <h2 class="denmu-section-title">Deal Categories</h2>
        </div>

        <!-- Horizontal Editorial Navigation Tabs -->
        <div class="denmu-cat-tabs-row" role="tablist">
          ${CATEGORIES.map(cat => `
            <button type="button" 
                    class="denmu-cat-tab ${cat.id === activeCatId ? 'active' : ''}" 
                    data-cat-id="${cat.id}">
              ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>

      <!-- Horizontal Editorial Track -->
      <div class="denmu-cat-track-wrap">
        <div class="denmu-cat-track" id="cat-carousel-track">
          <div class="cat-track-skeleton">
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
            <div class="skeleton-card"></div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach tab switching
  container.querySelectorAll('.denmu-cat-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.catId;
      if (catId === activeCatId) return;
      activeCatId = catId;

      container.querySelectorAll('.denmu-cat-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      loadCategoryContent(catId);
    });
  });
}

async function loadCategoryContent(catId) {
  const track = $('#cat-carousel-track');
  if (!track) return;

  track.innerHTML = `
    <div class="cat-track-loading meta-label">
      <span class="status-pulse-accent"></span> LOADING ${catId.toUpperCase().replace('-', ' ')}...
    </div>
  `;

  try {
    let deals = cachedData.get(catId);
    if (!deals) {
      const config = CATEGORIES.find(c => c.id === catId);
      const raw = await fetchDeals(config.params);
      const deduped = deduplicateDeals(raw).slice(0, 6);
      deals = await enrichDealsWithRAWG(deduped, 2);
      cachedData.set(catId, deals);
    }

    renderCategoryCards(track, deals);
  } catch (err) {
    console.error('Failed to load category deals:', err);
    track.innerHTML = `<div class="cat-track-error meta-label">Unable to load category stream.</div>`;
  }
}

function renderCategoryCards(track, deals) {
  track.innerHTML = deals.map((deal, i) => {
    const savings = Math.round(parseFloat(deal.savings));
    const salePrice = parseFloat(deal.salePrice);
    const normalPrice = parseFloat(deal.normalPrice);
    const isFree = salePrice === 0;
    const store = currentStoresMap.get(deal.storeID);
    const storeName = store ? store.storeName : 'Steam';
    const storeLogo = getStoreLogo(deal.storeID);
    const gameImg = deal.heroImage || deal.gameImage || getGameImage(deal);
    const dealLink = getDealLink(deal);
    const inWish = isInWishlist(deal.dealID);
    const genre = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'DEAL';

    return `
      <div class="denmu-cat-card" data-deal-id="${deal.dealID}">
        <div class="cat-card-media">
          <img src="${gameImg}" alt="${deal.title}" loading="lazy" />
          <span class="cat-card-discount">-${savings}%</span>
        </div>

        <div class="cat-card-body">
          <div class="cat-card-meta meta-label">
            <span class="cat-card-store">
              ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon-sm" />` : ''}
              ${storeName}
            </span>
            <span>// ${genre}</span>
          </div>

          <h3 class="cat-card-title">${deal.title}</h3>

          <div class="cat-card-foot">
            <div class="cat-card-prices">
              <span class="cat-card-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
              ${normalPrice > salePrice ? `<span class="cat-card-orig mono">${formatPrice(deal.normalPrice)}</span>` : ''}
            </div>

            <div class="cat-card-actions">
              <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="cat-card-cta" onclick="event.stopPropagation()">
                GET DEAL
              </a>
              <button type="button" class="cat-card-wish ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Wishlist" onclick="event.stopPropagation()">
                ${icons.heart}
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach card click to open Game Detail modal
  track.querySelectorAll('.denmu-cat-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('a') || e.target.closest('button')) return;
      const dealId = card.dataset.dealId;
      const targetDeal = deals.find(d => d.dealID === dealId);
      if (targetDeal) openGameDetail(targetDeal);
    });
  });

  // Attach wishlist buttons
  track.querySelectorAll('.cat-card-wish').forEach(btn => {
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

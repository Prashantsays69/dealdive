/* ============================================================
   Game Detail Modal — Cinematic Magazine View
   Structure per ui.txt:
   Cinematic artwork hero → game title → best current price →
   store comparison → savings → price history → screenshots/about → GET DEAL.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { fetchGameDetails, fetchDealDetails, getDealLink, getStoreLogo, getHeroImage } from '../api/cheapshark.js';
import { fetchRawgGame } from '../api/rawg.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';

let modalEl = null;
let storesMapCache = new Map();

export function initGameDetailModal({ storesMap } = {}) {
  if (storesMap) storesMapCache = storesMap;

  modalEl = document.getElementById('game-detail-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'game-detail-modal';
    modalEl.className = 'game-detail-modal';
    modalEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(modalEl);
  }

  // Backdrop click to close
  modalEl.addEventListener('click', (e) => {
    if (e.target === modalEl || e.target.closest('.detail-close-btn')) {
      closeGameDetail();
    }
  });

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modalEl.classList.contains('active')) {
      closeGameDetail();
    }
  });
}

export function closeGameDetail() {
  if (!modalEl) return;
  modalEl.classList.remove('active');
  modalEl.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/**
 * Open the cinematic Game Detail modal for a deal
 * @param {Object} deal - CheapShark deal object
 */
export async function openGameDetail(deal) {
  if (!modalEl) initGameDetailModal();

  document.body.style.overflow = 'hidden';
  modalEl.classList.add('active');
  modalEl.setAttribute('aria-hidden', 'false');

  // Render initial loading state
  modalEl.innerHTML = `
    <div class="detail-panel">
      <div class="detail-loading">
        <div class="status-pulse"></div>
        <span class="meta-label">LOADING INTEL // CHEAPSHARK + RAWG</span>
      </div>
    </div>
  `;

  try {
    // 1. Fetch RAWG metadata & screenshots
    const rawgPromise = fetchRawgGame(deal.title);

    // 2. Fetch full CheapShark game comparisons
    let gameId = deal.gameID;
    let cheapsharkDetails = null;

    if (!gameId && deal.dealID) {
      try {
        const dealInfo = await fetchDealDetails(deal.dealID);
        if (dealInfo && dealInfo.gameInfo) {
          gameId = dealInfo.gameInfo.gameID;
          cheapsharkDetails = dealInfo;
        }
      } catch (err) {
        console.warn('Could not fetch deal details for gameID:', err);
      }
    }

    let allDealsPromise = null;
    if (gameId) {
      allDealsPromise = fetchGameDetails(gameId).catch(() => null);
    }

    const [rawgData, fullGameData] = await Promise.all([rawgPromise, allDealsPromise]);

    renderModalContent(deal, rawgData, fullGameData);
  } catch (err) {
    console.error('Failed to load game detail:', err);
    renderModalContent(deal, null, null);
  }
}

function renderModalContent(deal, rawg, gameDetails) {
  const savings = Math.round(parseFloat(deal.savings || 0));
  const salePrice = parseFloat(deal.salePrice || deal.cheapest || 0);
  const normalPrice = parseFloat(deal.normalPrice || deal.retailPrice || 0);
  const isFree = salePrice === 0;

  // Visuals
  const heroArt = rawg?.backgroundImage || getHeroImage(deal) || deal.thumb;
  const inWish = isInWishlist(deal.dealID);
  const dealLink = getDealLink(deal);

  // Store
  const store = storesMapCache.get(deal.storeID);
  const storeName = store ? store.storeName : (deal.storeID === '1' ? 'Steam' : 'Official Store');
  const storeLogo = getStoreLogo(deal.storeID);

  // Lowest price ever
  const cheapestEver = gameDetails?.cheapestPriceEver;
  let formattedCheapestDate = '';
  if (cheapestEver?.date) {
    const d = new Date(cheapestEver.date * 1000);
    formattedCheapestDate = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
  }

  // Multi-store deals list
  const storeDeals = gameDetails?.deals || [];

  modalEl.innerHTML = `
    <div class="detail-panel">
      <!-- Close Button -->
      <button type="button" class="detail-close-btn" aria-label="Close dialog">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>

      <!-- 1. Cinematic Artwork Hero -->
      <div class="detail-hero-media">
        <img src="${heroArt}" alt="${deal.title}" class="detail-hero-img" />
        <div class="detail-hero-gradient"></div>
        <div class="detail-hero-overlay-tags">
          ${savings >= 70 ? `<span class="detail-badge-lowest meta-label">BEST PRICE</span>` : ''}
          ${cheapestEver && parseFloat(cheapestEver.price) >= salePrice ? `<span class="detail-badge-alltime meta-label">HISTORIC LOW</span>` : ''}
          <span class="detail-badge-discount meta-label">-${savings}% OFF</span>
        </div>
      </div>

      <!-- Detail Body Container -->
      <div class="detail-body">
        <!-- 2. Game Title & Editorial Metadata -->
        <div class="detail-header-block">
          <div class="detail-meta-row">
            <span class="meta-label text-accent">${rawg?.genres?.slice(0, 2).join(' • ') || 'PC GAMING'}</span>
            ${rawg?.released ? `<span class="meta-label">${rawg.released.split('-')[0]}</span>` : ''}
            ${rawg?.rating ? `<span class="detail-rating-pill mono">★ ${rawg.rating.toFixed(1)} RAWG</span>` : ''}
          </div>
          <h2 class="detail-title">${deal.title}</h2>
        </div>

        <!-- 3. Current Price & Savings Grid -->
        <div class="detail-price-matrix">
          <div class="price-cell primary-cell">
            <span class="meta-label">CURRENT BEST PRICE</span>
            <div class="price-val-wrap">
              <span class="price-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
              ${normalPrice > salePrice ? `<span class="price-orig mono">${formatPrice(deal.normalPrice)}</span>` : ''}
            </div>
            <span class="price-store-sub meta-label">OFFERED BY ${storeName.toUpperCase()}</span>
          </div>

          ${cheapestEver ? `
            <div class="price-cell history-cell">
              <span class="meta-label">HISTORICAL LOWEST</span>
              <span class="history-price mono">${formatPrice(cheapestEver.price)}</span>
              <span class="history-date meta-label">RECORDED ${formattedCheapestDate || 'RECENTLY'}</span>
            </div>
          ` : ''}

          <div class="price-cell actions-cell">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="detail-get-btn">
              <span>GET DEAL AT ${storeName.toUpperCase()}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>

            <button type="button" class="detail-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}">
              ${icons.heart}
              <span>${inWish ? 'SAVED TO WISHLIST' : 'SAVE TO WISHLIST'}</span>
            </button>
          </div>
        </div>

        <!-- 4. Multi-Store Price Comparison -->
        ${storeDeals.length > 1 ? `
          <div class="detail-store-comparison">
            <h3 class="comparison-heading meta-label">STOREFRONT PRICE COMPARISON (${storeDeals.length} STORES)</h3>
            <div class="comparison-list">
              ${storeDeals.slice(0, 6).map(sd => {
                const sObj = storesMapCache.get(sd.storeID);
                const sName = sObj ? sObj.storeName : `Store #${sd.storeID}`;
                const sLogo = getStoreLogo(sd.storeID);
                const sLink = `https://www.cheapshark.com/redirect?dealID=${sd.dealID}`;
                const isBest = parseFloat(sd.price) <= salePrice;

                return `
                  <div class="comparison-row ${isBest ? 'best-store' : ''}">
                    <div class="comparison-store-info">
                      ${sLogo ? `<img src="${sLogo}" alt="${sName}" class="comp-store-logo" />` : ''}
                      <span class="comp-store-name">${sName}</span>
                      ${isBest ? `<span class="best-badge meta-label">BEST DEAL</span>` : ''}
                    </div>
                    <div class="comparison-pricing">
                      <span class="comp-price mono">${formatPrice(sd.price)}</span>
                      <a href="${sLink}" target="_blank" rel="noopener noreferrer" class="comp-buy-link meta-label">
                        VIEW →
                      </a>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}

        <!-- 5. RAWG Screenshots Gallery -->
        ${rawg?.shortScreenshots && rawg.shortScreenshots.length > 1 ? `
          <div class="detail-gallery-section">
            <h3 class="gallery-heading meta-label">VISUAL ARCHIVE // SCREENSHOTS</h3>
            <div class="detail-screenshot-strip">
              ${rawg.shortScreenshots.slice(1, 5).map(img => `
                <div class="screenshot-tile" onclick="window.open('${img}', '_blank')">
                  <img src="${img}" alt="Screenshot" loading="lazy" />
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Attach Wishlist Button Event
  const wishBtn = modalEl.querySelector('.detail-wish-btn');
  if (wishBtn) {
    wishBtn.addEventListener('click', () => {
      const added = toggleWishlist(deal);
      wishBtn.classList.toggle('active', added);
      const span = wishBtn.querySelector('span');
      if (span) span.textContent = added ? 'SAVED TO WISHLIST' : 'SAVE TO WISHLIST';
    });
  }
}

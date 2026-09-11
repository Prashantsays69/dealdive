/* ============================================================
   Editorial Hero — Denmu Spread + Subtle AMIX Depth
   Full viewport, huge typography "FIND YOUR NEXT GAME.",
   high-res RAWG artwork, layered deal info, best price + discount,
   GET DEAL CTA, and subtle mouse parallax.
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchHeroDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { openGameDetail } from './gameDetailModal.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';

export async function initHeroImmersive({ onSearchClick, storesMap }) {
  const container = $('#hero');
  if (!container) return;

  renderHeroPlaceholder(container, onSearchClick);

  try {
    const rawDeals = await fetchHeroDeals();
    if (rawDeals && rawDeals.length > 0) {
      const enriched = await enrichDealsWithRAWG(rawDeals.slice(0, 1), 1);
      const topDeal = enriched[0] || rawDeals[0];
      renderEditorialHero(container, topDeal, storesMap, onSearchClick);
    }
  } catch (err) {
    console.error('Hero initialization error:', err);
  }
}

function renderHeroPlaceholder(container, onSearchClick) {
  container.innerHTML = `
    <div class="denmu-hero-stage">
      <div class="denmu-hero-content">
        <div class="denmu-hero-eyebrow meta-label">
          <span class="status-pulse-accent"></span>
          REAL-TIME PC GAME DEALS INTELLIGENCE
        </div>
        <h1 class="denmu-hero-title">
          <span>FIND YOUR</span>
          <span class="text-accent">NEXT GAME.</span>
        </h1>
        <p class="denmu-hero-lead">
          Verified live prices across Steam, Epic Games, GOG, and authorized storefronts.
        </p>
      </div>
    </div>
  `;
}

function renderEditorialHero(container, deal, storesMap, onSearchClick) {
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
  const rating = deal.rawgRating ? deal.rawgRating.toFixed(1) : (deal.metacriticScore || '95');
  const genre = deal.genres && deal.genres.length > 0 ? deal.genres[0].toUpperCase() : 'ACTION';

  container.innerHTML = `
    <div class="denmu-hero-stage" id="hero-stage">
      <!-- Left Editorial Block -->
      <div class="denmu-hero-content">
        <div class="denmu-hero-eyebrow meta-label">
          <span class="status-pulse-accent"></span>
          <span>CURATED EDITORIAL // REAL-TIME DISCOUNTS</span>
        </div>

        <h1 class="denmu-hero-title">
          <span class="title-row">FIND YOUR</span>
          <span class="title-row text-accent">NEXT GAME.</span>
        </h1>

        <p class="denmu-hero-lead">
          Track historical lows, compare storefronts, and buy your favorite PC titles at peak discount.
        </p>

        <!-- Compact Search bar in hero -->
        <div class="denmu-hero-search">
          <svg class="search-ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            id="hero-search-input" 
            placeholder="Search games, genres, stores..." 
            autocomplete="off" 
          />
          <button type="button" id="hero-search-btn" class="hero-search-btn">
            SEARCH
          </button>
        </div>

        <!-- Quick Jump Links -->
        <div class="denmu-hero-anchors">
          <a href="#featured" class="hero-anchor">Featured Drops ↓</a>
          <a href="#categories" class="hero-anchor">Trending Categories ↓</a>
          <a href="#discovery" class="hero-anchor">Browse Catalog ↓</a>
        </div>
      </div>

      <!-- Right Editorial Artwork Showcase with Layered Deal Info -->
      <div class="denmu-hero-artwork-frame" id="hero-artwork-frame">
        <div class="hero-art-media-wrap">
          <img src="${gameImg}" alt="${deal.title}" class="hero-art-img" id="hero-art-img" />
          <div class="hero-art-vignette"></div>

          <!-- Layered Deal Chips -->
          <div class="hero-art-top-bar">
            <div class="hero-art-tag meta-label">
              <span class="meta-dot"></span>
              ${genre}
            </div>
            <span class="hero-art-discount-badge">-${savings}%</span>
          </div>

          <!-- Bottom Layered Pricing Card -->
          <div class="hero-art-deal-layer">
            <div class="hero-layer-store-row">
              <div class="hero-layer-store">
                ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="store-icon-sm" />` : ''}
                <span class="meta-label">${storeName}</span>
              </div>
              <span class="hero-layer-rating meta-label">★ ${rating}</span>
            </div>

            <h3 class="hero-layer-title">${deal.title}</h3>

            <div class="hero-layer-pricing-row">
              <div class="hero-layer-prices">
                <span class="hero-layer-sale mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
                ${normalPrice > salePrice ? `<span class="hero-layer-orig mono">${formatPrice(deal.normalPrice)}</span>` : ''}
              </div>

              <div class="hero-layer-actions">
                <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="hero-layer-cta" title="Get Deal on Store">
                  GET DEAL
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/>
                    <polyline points="12 5 19 12 12 19"/>
                  </svg>
                </a>
                <button type="button" class="hero-layer-wish ${inWish ? 'active' : ''}" id="hero-wish-btn" aria-label="Wishlist">
                  ${icons.heart}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Search input interaction
  const searchInput = $('#hero-search-input');
  const searchBtn = $('#hero-search-btn');

  const executeSearch = () => {
    const q = searchInput?.value?.trim();
    if (q) {
      window.dispatchEvent(new CustomEvent('search-execute', { detail: { query: q } }));
      const catalog = document.querySelector('#discovery');
      if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onSearchClick();
    }
  };

  searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') executeSearch();
  });
  searchBtn?.addEventListener('click', executeSearch);

  // Card click opens Game Detail Modal
  $('#hero-artwork-frame')?.addEventListener('click', (e) => {
    if (e.target.closest('a') || e.target.closest('button')) return;
    openGameDetail(deal);
  });

  // Wishlist button
  $('#hero-wish-btn')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const added = toggleWishlist(deal);
    $('#hero-wish-btn')?.classList.toggle('active', added);
  });

  // Subtle Mouse Parallax
  const frame = $('#hero-artwork-frame');
  const img = $('#hero-art-img');
  window.addEventListener('mousemove', (e) => {
    if (!frame || !img) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 16;
    const y = (e.clientY / window.innerHeight - 0.5) * 16;
    frame.style.transform = `translate3d(${x * 0.4}px, ${y * 0.4}px, 0)`;
    img.style.transform = `scale(1.04) translate3d(${x * 0.2}px, ${y * 0.2}px, 0)`;
  }, { passive: true });
}

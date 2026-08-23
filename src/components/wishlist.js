/* ============================================================
   Wishlist Component (Client-side, localStorage)
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { getGameImage, getDealLink } from '../api/cheapshark.js';
import { updateWishlistCount } from './header.js';

const STORAGE_KEY = 'dealdive_wishlist';

/**
 * Get wishlist from localStorage
 */
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

/**
 * Save wishlist to localStorage
 */
function saveWishlist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  updateBadge();
}

/**
 * Check if a deal is in the wishlist
 */
export function isInWishlist(dealID) {
  const wl = getWishlist();
  return !!wl[dealID];
}

/**
 * Toggle a deal in/out of the wishlist
 */
export function toggleWishlist(deal) {
  const wl = getWishlist();

  if (wl[deal.dealID]) {
    delete wl[deal.dealID];
  } else {
    wl[deal.dealID] = {
      dealID: deal.dealID,
      title: deal.title,
      salePrice: deal.salePrice,
      normalPrice: deal.normalPrice,
      savings: deal.savings,
      thumb: deal.thumb || '',
      steamAppID: deal.steamAppID || null,
      storeID: deal.storeID,
      addedAt: Date.now(),
      savedPrice: deal.salePrice, // Track price at time of adding
    };
  }

  saveWishlist(wl);
  renderWishlistPanel();
}

/**
 * Remove from wishlist by dealID
 */
function removeFromWishlist(dealID) {
  const wl = getWishlist();
  delete wl[dealID];
  saveWishlist(wl);
  renderWishlistPanel();

  // Also update card state if visible
  const card = document.querySelector(`[data-deal-id="${dealID}"] .deal-wishlist-btn`);
  if (card) card.classList.remove('active');
}

/**
 * Get wishlist count
 */
export function getWishlistCount() {
  return Object.keys(getWishlist()).length;
}

/**
 * Update the badge in the header
 */
function updateBadge() {
  updateWishlistCount(getWishlistCount());
}

/**
 * Initialize wishlist panel
 */
export function initWishlist() {
  // Create overlay
  const overlay = el('div', { class: 'wishlist-overlay', id: 'wishlist-overlay' });
  overlay.addEventListener('click', closeWishlist);
  document.body.appendChild(overlay);

  renderWishlistPanel();
  updateBadge();
}

/**
 * Open the wishlist panel
 */
export function openWishlist() {
  const panel = $('#wishlist-panel');
  const overlay = $('#wishlist-overlay');
  if (panel) panel.setAttribute('aria-hidden', 'false');
  if (overlay) overlay.classList.add('visible');
  document.body.classList.add('no-scroll');
  renderWishlistPanel();
}

/**
 * Close the wishlist panel
 */
export function closeWishlist() {
  const panel = $('#wishlist-panel');
  const overlay = $('#wishlist-overlay');
  if (panel) panel.setAttribute('aria-hidden', 'true');
  if (overlay) overlay.classList.remove('visible');
  document.body.classList.remove('no-scroll');
}

/**
 * Render the wishlist panel contents
 */
function renderWishlistPanel() {
  const panel = $('#wishlist-panel');
  if (!panel) return;

  const wl = getWishlist();
  const items = Object.values(wl).sort((a, b) => b.addedAt - a.addedAt);

  panel.innerHTML = `
    <div class="wishlist-panel-header">
      <h2 class="wishlist-panel-title">Wishlist (${items.length})</h2>
      <button class="wishlist-panel-close" id="wishlist-close-btn" aria-label="Close wishlist">
        ${icons.x}
      </button>
    </div>
    <div class="wishlist-items" id="wishlist-items"></div>
  `;

  const container = $('#wishlist-items');
  const closeBtn = $('#wishlist-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeWishlist);

  if (items.length === 0) {
    container.innerHTML = `
      <div class="wishlist-empty">
        <svg class="wishlist-empty-icon" viewBox="0 0 24 24">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        <p>Your wishlist is empty.</p>
        <p style="margin-top: var(--space-2); font-size: var(--text-xs);">Click the heart icon on any deal to add it here.</p>
      </div>
    `;
    return;
  }

  items.forEach(item => {
    const imgSrc = item.steamAppID
      ? `https://cdn.akamai.steamstatic.com/steam/apps/${item.steamAppID}/header.jpg`
      : item.thumb;

    const itemEl = el('div', { class: 'wishlist-item' });
    itemEl.innerHTML = `
      <img class="wishlist-item-thumb" src="${imgSrc}" alt="${item.title}"
           onload="this.classList.add('loaded')" onerror="this.classList.add('loaded')" loading="lazy" />
      <div class="wishlist-item-info">
        <div class="wishlist-item-title">${item.title}</div>
        <div class="wishlist-item-price">${formatPrice(item.salePrice)}</div>
      </div>
    `;

    // Remove button
    const removeBtn = el('button', {
      class: 'wishlist-item-remove',
      'aria-label': 'Remove from wishlist',
      html: icons.trash,
      onClick: () => removeFromWishlist(item.dealID),
    });
    itemEl.appendChild(removeBtn);

    // Click to open deal
    itemEl.addEventListener('click', (e) => {
      if (e.target.closest('.wishlist-item-remove')) return;
      window.open(getDealLink(item), '_blank', 'noopener,noreferrer');
    });
    itemEl.style.cursor = 'pointer';

    container.appendChild(itemEl);
  });
}

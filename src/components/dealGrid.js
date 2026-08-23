/* ============================================================
   Deal Grid — Infinite Scroll
   ============================================================ */

import { $, el } from '../utils/dom.js';
import { fetchDeals, deduplicateDeals } from '../api/cheapshark.js';
import { createDealCard, createSkeletonCard } from './dealCard.js';

let currentPage = 0;
let isLoading = false;
let hasMore = true;
let observer = null;
let currentFilters = {};
let storesMap = new Map();
const PAGE_SIZE = 24;

export function initDealGrid({ stores, filters }) {
  storesMap = new Map();
  stores.forEach(s => storesMap.set(s.storeID, s));
  currentFilters = filters || {};

  setupIntersectionObserver();
  loadDeals(true);
}

/**
 * Refresh the grid with new filters
 */
export function refreshGrid(filters) {
  currentFilters = filters || {};
  currentPage = 0;
  hasMore = true;
  isLoading = false;

  const grid = $('#deals-grid');
  if (grid) grid.innerHTML = '';

  loadDeals(true);
}

async function loadDeals(showSkeleton = false) {
  if (isLoading || !hasMore) return;
  isLoading = true;

  const grid = $('#deals-grid');
  if (!grid) return;

  // Show skeletons while loading
  let skeletons = [];
  if (showSkeleton) {
    for (let i = 0; i < 8; i++) {
      const skel = createSkeletonCard();
      grid.appendChild(skel);
      skeletons.push(skel);
    }
  } else {
    // Show a loading indicator
    showLoadingMore(true);
  }

  try {
    const params = {
      pageNumber: currentPage,
      pageSize: PAGE_SIZE,
      sortBy: currentFilters.sortBy || 'Deal Rating',
      onSale: currentFilters.onSale !== undefined ? currentFilters.onSale : true,
    };

    if (currentFilters.storeID) params.storeID = currentFilters.storeID;
    if (currentFilters.lowerPrice !== undefined && currentFilters.lowerPrice !== null) params.lowerPrice = currentFilters.lowerPrice;
    if (currentFilters.upperPrice !== undefined && currentFilters.upperPrice !== null) params.upperPrice = currentFilters.upperPrice;
    if (currentFilters.title) params.title = currentFilters.title;

    const deals = await fetchDeals({
      ...params,
      pageSize: 48, // Fetch extra so deduplication still yields plenty of unique deals
    });

    // Remove skeletons
    skeletons.forEach(s => s.remove());
    showLoadingMore(false);

    if (!deals || deals.length === 0) {
      hasMore = false;
      if (currentPage === 0) {
        showEmptyState(grid);
      }
      isLoading = false;
      return;
    }

    // Deduplicate deals so the exact same title doesn't repeat 5 times from 5 different stores
    let filteredDeals = deduplicateDeals(deals);

    // Filter by minimum savings if set
    if (currentFilters.minSavings) {
      filteredDeals = filteredDeals.filter(d => parseFloat(d.savings) >= currentFilters.minSavings);
    }

    // Render cards
    filteredDeals.forEach((deal, i) => {
      const isFeatured = currentPage === 0 && i === 0;
      const card = createDealCard(deal, storesMap, isFeatured, i);
      grid.appendChild(card);
    });

    // Update results count
    updateResultsCount();

    // Check if we got a full page (might have more)
    if (deals.length < PAGE_SIZE) {
      hasMore = false;
    }

    currentPage++;

  } catch (err) {
    console.error('Failed to load deals:', err);
    skeletons.forEach(s => s.remove());
    showLoadingMore(false);

    if (currentPage === 0) {
      showErrorState(grid);
    }
  }

  isLoading = false;
}

function setupIntersectionObserver() {
  const sentinel = $('#scroll-sentinel');
  if (!sentinel) return;

  if (observer) observer.disconnect();

  observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !isLoading && hasMore) {
        loadDeals(false);
      }
    });
  }, {
    rootMargin: '400px',
  });

  observer.observe(sentinel);
}

function showLoadingMore(show) {
  let loader = $('#loading-more');
  if (show && !loader) {
    loader = el('div', { class: 'loading-more', id: 'loading-more' });
    loader.innerHTML = '<div class="loading-spinner"></div>';
    const container = $('#deals-container');
    if (container) {
      const sentinel = $('#scroll-sentinel');
      container.insertBefore(loader, sentinel);
    }
  } else if (!show && loader) {
    loader.remove();
  }
}

function showEmptyState(grid) {
  grid.innerHTML = `
    <div class="empty-state">
      <h2 class="empty-state-title">No deals found</h2>
      <p class="empty-state-text">Try adjusting your filters or search for a specific game.</p>
    </div>
  `;
}

function showErrorState(grid) {
  grid.innerHTML = `
    <div class="empty-state">
      <h2 class="empty-state-title">Something went wrong</h2>
      <p class="empty-state-text">Unable to load deals. Please try again later.</p>
    </div>
  `;
}

function updateResultsCount() {
  const grid = $('#deals-grid');
  if (!grid) return;
  const count = grid.querySelectorAll('.deal-card').length;

  let header = $('#results-header');
  if (!header) {
    header = el('div', { class: 'results-header', id: 'results-header' });
    header.innerHTML = `<span class="results-count">${count} deals</span>`;
    const container = $('#deals-container');
    if (container) {
      container.insertBefore(header, grid);
    }
  } else {
    const countEl = header.querySelector('.results-count');
    if (countEl) countEl.textContent = `${count} deals`;
  }
}

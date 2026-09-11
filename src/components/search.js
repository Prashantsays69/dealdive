/* ============================================================
   Search Modal Component — Denmu Editorial Search
   Debounced typing, artwork suggestions, exact match ranking,
   Enter key instant catalog filtering, and direct game detail opening.
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { searchGames, getDealLink } from '../api/cheapshark.js';
import { formatPrice, debounce } from '../utils/format.js';
import { refreshGrid } from './dealGrid.js';
import { openGameDetail } from './gameDetailModal.js';

let isOpen = false;

export function initSearch() {
  const modal = $('#search-modal');
  if (!modal) return;

  modal.innerHTML = `
    <div class="search-modal-backdrop" id="search-modal-backdrop"></div>
    <div class="search-modal-inner">
      <div class="search-header-row">
        <span class="meta-label">DISCOVER // REAL-TIME SEARCH</span>
        <button class="search-close-btn" id="search-close-btn" aria-label="Close search">
          ${icons.x}
        </button>
      </div>

      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input 
          type="text" 
          class="search-input" 
          id="search-input" 
          placeholder="Search games, genres, stores... (Press Enter to search catalog)" 
          autocomplete="off" 
          spellcheck="false"
        />
      </div>

      <div class="search-results" id="search-results"></div>

      <div class="search-hint" id="search-hint">
        <span>Press <kbd>↵ Enter</kbd> to filter catalog</span>
        <span>&middot;</span>
        <span><kbd>Esc</kbd> to dismiss</span>
      </div>
    </div>
  `;

  const input = $('#search-input');
  const results = $('#search-results');
  const closeBtn = $('#search-close-btn');
  const backdrop = $('#search-modal-backdrop');

  // Debounced search
  const doSearch = debounce(async (query) => {
    if (!query || query.trim().length < 2) {
      results.innerHTML = '';
      $('#search-hint').style.display = '';
      return;
    }

    results.innerHTML = '<div class="search-loading-text meta-label">SEARCHING GLOBAL INDEX...</div>';
    $('#search-hint').style.display = 'none';

    try {
      const games = await searchGames(query, 16);

      if (!games || games.length === 0) {
        results.innerHTML = `
          <div class="search-empty-state">
            <p>No results found for "<strong>${escapeHtml(query)}</strong>"</p>
            <span class="meta-label">Try searching a different franchise or keyword</span>
          </div>
        `;
        return;
      }

      // Prioritize exact or prefix matches
      const lowerQuery = query.toLowerCase();
      const sorted = [...games].sort((a, b) => {
        const aExact = a.external.toLowerCase() === lowerQuery ? 2 : (a.external.toLowerCase().startsWith(lowerQuery) ? 1 : 0);
        const bExact = b.external.toLowerCase() === lowerQuery ? 2 : (b.external.toLowerCase().startsWith(lowerQuery) ? 1 : 0);
        return bExact - aExact;
      });

      results.innerHTML = '';
      sorted.forEach(game => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        const salePrice = parseFloat(game.cheapest);

        item.innerHTML = `
          <div class="search-result-thumb-wrap">
            <img class="search-result-thumb" src="${game.thumb}" alt="${escapeHtml(game.external)}"
                 onload="this.classList.add('loaded')" onerror="this.classList.add('loaded')" loading="lazy" />
          </div>
          <div class="search-result-info">
            <div class="search-result-title">${escapeHtml(game.external)}</div>
            <div class="search-result-meta meta-label">
              ${game.steamAppID ? '<span>STEAM VERIFIED</span>' : '<span>VERIFIED DEAL</span>'}
            </div>
          </div>
          <div class="search-result-price-box">
            <span class="search-result-price mono">${salePrice === 0 ? 'FREE' : `FROM ${formatPrice(salePrice)}`}</span>
            <span class="search-result-arrow">→</span>
          </div>
        `;

        item.addEventListener('click', () => {
          closeSearch();
          // Open detail modal with standard deal structure
          openGameDetail({
            title: game.external,
            dealID: game.cheapestDealID,
            steamAppID: game.steamAppID,
            salePrice: String(game.cheapest),
            normalPrice: String(game.cheapest),
            savings: '0',
            storeID: '1',
            thumb: game.thumb,
          });
        });

        results.appendChild(item);
      });

    } catch (err) {
      console.error('Search failed:', err);
      results.innerHTML = '<div class="search-empty-state"><p>Search query failed. Please try again.</p></div>';
    }
  }, 250);

  input?.addEventListener('input', () => doSearch(input.value));

  // Enter key in search input triggers catalog search
  input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = input.value.trim();
      if (q) {
        closeSearch();
        refreshGrid({
          title: q,
          sortBy: 'Deal Rating',
          onSale: true,
        });
        const catalog = document.getElementById('catalog');
        if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  });

  // Listen to external search execution (e.g. from Hero)
  window.addEventListener('search-execute', (e) => {
    const { query } = e.detail;
    if (query) {
      refreshGrid({
        title: query,
        sortBy: 'Deal Rating',
        onSale: true,
      });
    }
  });

  // Close handlers
  closeBtn?.addEventListener('click', closeSearch);
  backdrop?.addEventListener('click', closeSearch);

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      closeSearch();
    }
  });
}

export function openSearch() {
  const modal = $('#search-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('open');
  document.body.classList.add('no-scroll');
  isOpen = true;

  setTimeout(() => {
    const input = $('#search-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    const results = $('#search-results');
    if (results) results.innerHTML = '';
    const hint = $('#search-hint');
    if (hint) hint.style.display = '';
  }, 100);
}

export function closeSearch() {
  const modal = $('#search-modal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  modal.classList.remove('open');
  document.body.classList.remove('no-scroll');
  isOpen = false;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

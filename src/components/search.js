/* ============================================================
   Search Modal Component
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { searchGames, getGameImage, getDealLink } from '../api/cheapshark.js';
import { formatPrice } from '../utils/format.js';
import { debounce } from '../utils/format.js';

let isOpen = false;

export function initSearch() {
  const modal = $('#search-modal');
  if (!modal) return;

  modal.innerHTML = `
    <button class="search-close-btn" id="search-close-btn" aria-label="Close search">
      ${icons.x}
    </button>
    <div class="search-modal-inner">
      <div class="search-input-wrapper">
        <svg class="search-icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" class="search-input" id="search-input" placeholder="Search games..." autocomplete="off" />
      </div>
      <div class="search-results" id="search-results"></div>
      <div class="search-hint" id="search-hint">
        Press <kbd>Esc</kbd> to close &middot; <kbd>/</kbd> to open search
      </div>
    </div>
  `;

  const input = $('#search-input');
  const results = $('#search-results');
  const closeBtn = $('#search-close-btn');

  // Debounced search
  const doSearch = debounce(async (query) => {
    if (!query || query.trim().length < 2) {
      results.innerHTML = '';
      $('#search-hint').style.display = '';
      return;
    }

    results.innerHTML = '<div class="search-hint">Searching...</div>';
    $('#search-hint').style.display = 'none';

    try {
      const games = await searchGames(query, 12);

      if (!games || games.length === 0) {
        results.innerHTML = `
          <div class="search-hint">
            No results for "<strong>${escapeHtml(query)}</strong>". Try a different search.
          </div>
        `;
        return;
      }

      results.innerHTML = '';
      games.forEach(game => {
        const item = document.createElement('div');
        item.className = 'search-result-item';
        item.innerHTML = `
          <img class="search-result-thumb" src="${game.thumb}" alt="${escapeHtml(game.external)}"
               onload="this.classList.add('loaded')" onerror="this.classList.add('loaded')" loading="lazy" />
          <div class="search-result-info">
            <div class="search-result-title">${escapeHtml(game.external)}</div>
            <div class="search-result-price">From ${formatPrice(game.cheapest)}</div>
          </div>
        `;
        item.addEventListener('click', () => {
          if (game.steamAppID) {
            window.open(`https://store.steampowered.com/app/${game.steamAppID}/`, '_blank', 'noopener,noreferrer');
          } else if (game.cheapestDealID) {
            window.open(getDealLink(game.cheapestDealID), '_blank', 'noopener,noreferrer');
          }
        });
        results.appendChild(item);
      });

    } catch (err) {
      console.error('Search failed:', err);
      results.innerHTML = '<div class="search-hint">Search failed. Try again.</div>';
    }
  }, 300);

  input.addEventListener('input', () => doSearch(input.value));

  // Close
  closeBtn.addEventListener('click', closeSearch);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeSearch();
  });

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
  document.body.classList.add('no-scroll');
  isOpen = true;

  // Focus input
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
  document.body.classList.remove('no-scroll');
  isOpen = false;
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

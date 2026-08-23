/* ============================================================
   DealDive — Main Entry Point
   ============================================================ */

// Styles
import './styles/variables.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

// Components
import { initHeader } from './components/header.js';
import { initHero } from './components/hero.js';
import { initFilters } from './components/filters.js';
import { initDealGrid, refreshGrid } from './components/dealGrid.js';
import { initSearch, openSearch } from './components/search.js';
import { initWishlist, openWishlist } from './components/wishlist.js';
import { fetchStores } from './api/cheapshark.js';

// ---- App Init ----
async function init() {
  // 1. Fetch stores first (needed by all components)
  let stores = [];
  try {
    stores = await fetchStores();
  } catch (err) {
    console.error('Failed to fetch stores:', err);
    // Fallback: continue without store data
  }

  const storesMap = new Map();
  stores.forEach(s => storesMap.set(s.storeID, s));

  // 2. Init header
  initHeader({
    onSearchClick: openSearch,
    onWishlistClick: openWishlist,
  });

  // 3. Init hero carousel
  initHero(storesMap);

  // 4. Init filters
  initFilters({
    stores,
    onChange: (filters) => {
      refreshGrid(filters);
    },
  });

  // 5. Init deal grid
  initDealGrid({
    stores,
    filters: { sortBy: 'Deal Rating', onSale: true },
  });

  // 6. Init search
  initSearch();

  // 7. Init wishlist
  initWishlist();

  // 8. Render footer
  renderFooter();

  // 9. Handle nav changes
  window.addEventListener('nav-change', (e) => {
    const { nav } = e.detail;
    handleNavChange(nav);
  });
}

function handleNavChange(nav) {
  switch (nav) {
    case 'free':
      refreshGrid({ sortBy: 'Deal Rating', upperPrice: 0, lowerPrice: 0, onSale: true });
      break;
    case 'deals':
      refreshGrid({ sortBy: 'Deal Rating', onSale: true });
      break;
    case 'stores':
      // Could show a stores browse view; for now just sort by store
      refreshGrid({ sortBy: 'Store', onSale: true });
      break;
    default:
      refreshGrid({ sortBy: 'Deal Rating', onSale: true });
  }

  // Scroll to deals
  const main = document.getElementById('main-content');
  if (main) {
    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-inner">
      <span class="footer-brand">DealDive</span>
      <div class="footer-links">
        <a href="https://www.cheapshark.com" target="_blank" rel="noopener noreferrer">Powered by CheapShark</a>
      </div>
      <p class="footer-credit">
        Prices and availability sourced from <a href="https://www.cheapshark.com" target="_blank" rel="noopener noreferrer">CheapShark API</a>.
        DealDive is a discovery tool — all purchases happen on official stores.
      </p>
    </div>
  `;
}

// Launch
init().catch(err => {
  console.error('App init failed:', err);
});

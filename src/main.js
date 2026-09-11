/* ============================================================
   DealDive — Main Entry Point (Denmu Editorial Architecture)
   ============================================================ */

// Styles
import './styles/variables.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

// 3D Engine
import { initScene3D, measureKeyframes } from './3d/scene3d.js';

// API
import { fetchStores } from './api/cheapshark.js';

// Components
import { initHeader } from './components/header.js';
import { initHeroImmersive } from './components/heroImmersive.js';
import { initFeaturedDeal } from './components/featuredDeal.js';
import { initDealCategories } from './components/dealCategories.js';
import { initPlatformSection } from './components/platformSection.js';
import { initGameDetailModal } from './components/gameDetailModal.js';
import { initFilters } from './components/filters.js';
import { initDealGrid, refreshGrid } from './components/dealGrid.js';
import { initSearch, openSearch } from './components/search.js';
import { initWishlist, openWishlist } from './components/wishlist.js';

async function init() {
  // 1. Three.js Background Engine (Subtle depth & parallax)
  initScene3D();

  // 2. Fetch stores
  let stores = [];
  try {
    stores = await fetchStores();
  } catch (err) {
    console.error('Failed to fetch stores:', err);
  }

  const storesMap = new Map();
  stores.forEach(s => storesMap.set(s.storeID, s));

  // 3. 1. MINIMAL NAV
  initHeader({
    onSearchClick: openSearch,
    onWishlistClick: openWishlist,
  });

  // 4. Game Detail Modal
  initGameDetailModal({ storesMap });

  // 5. 2. EDITORIAL HERO
  await initHeroImmersive({
    onSearchClick: openSearch,
    storesMap,
  });

  // 6. 3. FEATURED DEALS (Large asymmetric editorial compositions)
  await initFeaturedDeal({ storesMap });

  // 7. 4. DEAL CATEGORIES (Horizontal editorial sections)
  await initDealCategories({ storesMap });

  // 8. 5. GAME DISCOVERY (Compact store tabs & filter bar + catalog)
  initPlatformSection({ stores });

  initFilters({
    stores,
    onChange: (filters) => {
      refreshGrid(filters);
    },
  });

  initDealGrid({
    stores,
    filters: { storeID: '1', sortBy: 'Deal Rating', onSale: true },
  });

  // 9. 6. FOOTER (Large typography, brand statement, minimal links)
  renderFooter();

  // 10. Modals
  initSearch();
  initWishlist();

  // 11. Measure keyframes
  setTimeout(() => {
    measureKeyframes();
  }, 400);
}

function renderFooter() {
  const footer = document.getElementById('foot');
  if (!footer) return;

  footer.innerHTML = `
    <div class="denmu-footer-inner">
      <div class="denmu-footer-brand-statement">
        <span class="meta-label text-accent">DEALDIVE // EDITORIAL INTELLIGENCE</span>
        <h2 class="denmu-footer-huge-title">
          NEVER OVERPAY FOR <span class="text-accent">GAMES.</span>
        </h2>
        <p class="denmu-footer-lead">
          Real-time tracking of historical lows and authorized storefront discounts across the PC gaming universe.
        </p>
      </div>

      <div class="denmu-footer-nav-grid">
        <div class="footer-nav-col">
          <span class="meta-label footer-col-heading">NAVIGATION</span>
          <a href="#hero" class="footer-nav-link">Editorial Top</a>
          <a href="#featured" class="footer-nav-link">Featured Drops</a>
          <a href="#categories" class="footer-nav-link">Trending Categories</a>
          <a href="#discovery" class="footer-nav-link">Game Discovery</a>
        </div>

        <div class="footer-nav-col">
          <span class="meta-label footer-col-heading">INTELLIGENCE</span>
          <a href="https://apidocs.cheapshark.com" target="_blank" rel="noopener noreferrer" class="footer-nav-link">CheapShark API</a>
          <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer" class="footer-nav-link">RAWG Video Games Database</a>
          <a href="https://store.steampowered.com" target="_blank" rel="noopener noreferrer" class="footer-nav-link">Steam Store</a>
          <a href="https://threejs.org" target="_blank" rel="noopener noreferrer" class="footer-nav-link">Three.js WebGL</a>
        </div>

        <div class="footer-nav-col">
          <span class="meta-label footer-col-heading">ARCHITECT</span>
          <span class="footer-architect-name">Prashant</span>
          <div class="footer-architect-links">
            <a href="https://github.com/Prashantsays69" target="_blank" rel="noopener noreferrer" class="footer-nav-link">GitHub ↗</a>
            <a href="https://www.linkedin.com/in/prashantsays69" target="_blank" rel="noopener noreferrer" class="footer-nav-link">LinkedIn ↗</a>
            <a href="https://www.instagram.com/prashantsays69" target="_blank" rel="noopener noreferrer" class="footer-nav-link">Instagram ↗</a>
          </div>
        </div>
      </div>

      <div class="denmu-footer-bottom">
        <div class="footer-status-indicator">
          <span class="status-pulse-green"></span>
          <span class="meta-label">ALL STORES CONNECTED // DIRECT REDIRECTS</span>
        </div>
        <div class="footer-copy meta-label">
          © ${new Date().getFullYear()} DEALDIVE. ALL RIGHTS RESERVED.
        </div>
      </div>
    </div>
  `;
}

init().catch(err => {
  console.error('App init failed:', err);
});

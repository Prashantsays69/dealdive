/* ============================================================
   DealDive — Main Entry Point (Immersive 3D Edition)
   ============================================================ */

// Styles
import './styles/variables.css';
import './styles/reset.css';
import './styles/base.css';
import './styles/components.css';
import './styles/animations.css';

// 3D Engine
import { initScene3D } from './3d/scene3d.js';

// Components — existing
import { initHeader } from './components/header.js';
import { initFilters } from './components/filters.js';
import { initDealGrid, refreshGrid } from './components/dealGrid.js';
import { initSearch, openSearch } from './components/search.js';
import { initWishlist, openWishlist } from './components/wishlist.js';
import { fetchStores } from './api/cheapshark.js';

// Components — new immersive sections
import { initHeroImmersive } from './components/heroImmersive.js';
import { initFeaturedGames } from './components/featuredGames.js';
import { initBestDealsGallery } from './components/bestDealsGallery.js';
import { initPlatformSection } from './components/platformSection.js';
import { initTrendingCards } from './components/trendingCards.js';

// ---- App Init ----
async function init() {
  // 0. Init 3D scene (creates WebGL canvas, starts render loop)
  initScene3D();

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

  // 2. Init header (floating dark navbar)
  initHeader({
    onSearchClick: openSearch,
    onWishlistClick: openWishlist,
  });

  // 3. Init immersive hero (3D artwork planes + headline + search trigger)
  initHeroImmersive({
    onSearchClick: openSearch,
    storesMap,
  });

  // 4. Init featured games (scroll-driven cinematic scenes)
  initFeaturedGames({ storesMap });

  // 5. Init best deals gallery (horizontal 3D gallery)
  initBestDealsGallery({ storesMap });

  // 6. Init platform section (interactive store tiles)
  initPlatformSection({ stores });

  // 7. Init trending cards (layered 3D cards)
  initTrendingCards({ storesMap });

  // 8. Render CTA section
  renderCTASection();

  // 9. Init filters (preserved)
  initFilters({
    stores,
    onChange: (filters) => {
      refreshGrid(filters);
    },
  });

  // 10. Init deal grid with Steam ('1') as default store (preserved)
  initDealGrid({
    stores,
    filters: { storeID: '1', sortBy: 'Deal Rating', onSale: true },
  });

  // 11. Init search (preserved)
  initSearch();

  // 12. Init wishlist (preserved)
  initWishlist();

  // 13. Render footer
  renderFooter();

  // 14. Handle nav changes (preserved)
  window.addEventListener('nav-change', (e) => {
    const { nav } = e.detail;
    handleNavChange(nav);
  });
}

function handleNavChange(nav) {
  switch (nav) {
    case 'popular':
      refreshGrid({ sortBy: 'Metacritic', metacritic: 75, storeID: '1,25', onSale: true });
      break;
    case 'free':
      refreshGrid({ sortBy: 'Deal Rating', upperPrice: 0, lowerPrice: 0, onSale: true });
      break;
    case 'deals':
    default:
      refreshGrid({ storeID: '1', sortBy: 'Deal Rating', onSale: true });
  }

  // Scroll to deals
  const main = document.getElementById('main-content');
  if (main) {
    main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderCTASection() {
  const cta = document.getElementById('cta-section');
  if (!cta) return;

  cta.innerHTML = `
    <div class="cta-inner">
      <div class="cta-label meta-label">Ready to Save?</div>
      <h2 class="cta-headline display-h1">Never Overpay for <span class="text-accent">Games</span> Again</h2>
      <p class="cta-sub">Browse thousands of deals across all major PC gaming stores. Real-time prices, no middleman.</p>
      <div class="cta-actions">
        <button class="cta-primary" id="cta-browse-btn">
          Browse All Deals
          <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </button>
      </div>
    </div>
  `;

  document.getElementById('cta-browse-btn')?.addEventListener('click', () => {
    const main = document.getElementById('main-content');
    if (main) main.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function renderFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  footer.innerHTML = `
    <div class="footer-inner">
      <div class="footer-brand-block">
        <span class="footer-brand">Deal<span class="logo-accent">Dive</span></span>
        <p class="footer-subtext">Discover top PC game deals on Steam & Epic Games Store.</p>
      </div>

      <div class="footer-dev-card">
        <span class="dev-label meta-label">Designed & Developed by</span>
        <span class="dev-name">Prashant</span>
        <div class="dev-socials">
          <a href="https://github.com/Prashantsays69" target="_blank" rel="noopener noreferrer" title="GitHub" aria-label="GitHub">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            <span>GitHub</span>
          </a>
          <a href="https://www.linkedin.com/in/prashantsays69" target="_blank" rel="noopener noreferrer" title="LinkedIn" aria-label="LinkedIn">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.7a1.63 1.63 0 1 0 0 3.26 1.63 1.63 0 0 0 0-3.26z"/></svg>
            <span>LinkedIn</span>
          </a>
          <a href="https://www.instagram.com/prashantsays69" target="_blank" rel="noopener noreferrer" title="Instagram" aria-label="Instagram">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
            <span>Instagram</span>
          </a>
        </div>
      </div>

      <p class="footer-credit">
        All deals & prices redirect directly to official storefronts (Steam, Epic Games Store, GOG).
      </p>
    </div>
  `;
}

// Launch
init().catch(err => {
  console.error('App init failed:', err);
});

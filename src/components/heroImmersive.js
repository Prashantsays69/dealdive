/* ============================================================
   Immersive Hero — Full-screen cinematic 3D entrance
   Large game artwork planes with mouse parallax depth,
   oversized headline, and integrated search trigger.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { fetchHeroDeals, getHeroImage, getGameImage } from '../api/cheapshark.js';
import { isWebGLEnabled, addToScene, registerSection } from '../3d/scene3d.js';
import { createImagePlaneGroup, updatePlanesParallax } from '../3d/imageplane.js';

let heroGroup = null;
let heroDeals = [];

export async function initHeroImmersive({ onSearchClick, storesMap }) {
  const container = $('#hero-3d');
  if (!container) return;

  // Fetch hero deals
  try {
    heroDeals = await fetchHeroDeals();
  } catch (err) {
    console.error('Hero deals fetch failed:', err);
    heroDeals = [];
  }

  // Render HTML overlay
  renderHeroHTML(container, onSearchClick);

  // Init 3D planes if WebGL available
  if (isWebGLEnabled() && heroDeals.length > 0) {
    await initHero3D();
  }

  // Scroll-triggered reveal
  setTimeout(() => {
    container.classList.add('hero-entered');
  }, 100);
}

function renderHeroHTML(container, onSearchClick) {
  container.innerHTML = `
    <div class="hero3d-content">
      <div class="hero3d-meta meta-label">PC Game Deals — Live Prices</div>
      <h1 class="hero3d-headline display-hero">
        <span class="hero3d-line">Discover.</span>
        <span class="hero3d-line">Compare.</span>
        <span class="hero3d-line hero3d-line-accent">Save.</span>
      </h1>
      <p class="hero3d-sub">The best PC game deals across Steam, Epic, GOG and more — curated in real-time.</p>
      <button class="hero3d-search-trigger" id="hero-search-trigger">
        <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search games...</span>
        <kbd>⌘K</kbd>
      </button>
    </div>
    <div class="hero3d-scroll-indicator">
      <span class="meta-label">Scroll</span>
      <div class="hero3d-scroll-line"></div>
    </div>
  `;

  // Search trigger
  const searchTrigger = $('#hero-search-trigger');
  if (searchTrigger && onSearchClick) {
    searchTrigger.addEventListener('click', onSearchClick);
  }
}

async function initHero3D() {
  const imageUrls = heroDeals
    .slice(0, 5)
    .map(deal => getHeroImage(deal))
    .filter(Boolean);

  if (imageUrls.length === 0) return;

  try {
    heroGroup = await createImagePlaneGroup(imageUrls, {
      spacing: 3,
      depthSpacing: 2.5,
      startZ: -3,
      maxWidth: 6,
      scaleVariation: 0.5,
    });

    heroGroup.position.set(2, 0, -2);

    addToScene(heroGroup);

    // Register for scroll/mouse updates
    registerSection({
      id: 'hero',
      update: (scrollProg, mx, my, elapsed) => {
        if (!heroGroup) return;

        // Parallax from mouse
        updatePlanesParallax(heroGroup, mx, my);

        // Scroll: push group deeper as user scrolls
        heroGroup.position.z = -2 - scrollProg * 15;
        heroGroup.rotation.y = scrollProg * 0.3;

        // Gentle float
        heroGroup.position.y = Math.sin(elapsed * 0.3) * 0.1;
      },
    });
  } catch (err) {
    console.warn('Hero 3D init failed, falling back to CSS:', err);
  }
}

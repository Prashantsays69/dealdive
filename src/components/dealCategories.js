/* ============================================================
   Deal Categories — Curated Quick-Access Filters
   Action, RPG, Strategy, Shooter, Open World, Indie
   Filters the catalog instantly without full page reload.
   ============================================================ */

import { $ } from '../utils/dom.js';
import { refreshGrid } from './dealGrid.js';

const CATEGORIES = [
  { id: 'all', name: 'All Genres', desc: 'Every active discount' },
  { id: 'action', name: 'Action', desc: 'Fast-paced combat & adventures', query: 'action' },
  { id: 'rpg', name: 'RPG', desc: 'Deep worlds & progression', query: 'rpg' },
  { id: 'strategy', name: 'Strategy', desc: 'Tactical & grand management', query: 'strategy' },
  { id: 'shooter', name: 'Shooter', desc: 'FPS & precision gunplay', query: 'shooter' },
  { id: 'open-world', name: 'Open World', desc: 'Expansive sandbox realms', query: 'world' },
  { id: 'indie', name: 'Indie', desc: 'Innovative creator masterworks', query: 'indie' },
];

let activeCategoryId = 'all';

export function initDealCategories() {
  const container = $('#deal-categories');
  if (!container) return;

  container.innerHTML = `
    <div class="categories-inner">
      <div class="categories-header">
        <div class="meta-label">05 // CURATED GENRES</div>
        <h2 class="categories-title">Explore by Category</h2>
        <p class="categories-sub">Filter thousands of live discounts by your preferred game archetype.</p>
      </div>

      <div class="categories-pills-row">
        ${CATEGORIES.map(cat => `
          <button type="button" class="category-pill-btn ${cat.id === activeCategoryId ? 'active' : ''}" data-cat-id="${cat.id}">
            <span class="category-pill-name">${cat.name}</span>
            <span class="category-pill-desc meta-label">${cat.desc}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;

  // Attach click events
  container.querySelectorAll('.category-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const catId = btn.dataset.catId;
      activeCategoryId = catId;

      container.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const selected = CATEGORIES.find(c => c.id === catId);
      if (catId === 'all') {
        refreshGrid({ sortBy: 'Deal Rating', onSale: true });
      } else {
        refreshGrid({
          title: selected?.query || selected?.name,
          sortBy: 'Deal Rating',
          onSale: true,
        });
      }

      // Smooth scroll to catalog
      const catalog = document.getElementById('catalog');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

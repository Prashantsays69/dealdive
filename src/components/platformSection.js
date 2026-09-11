/* ============================================================
   Platform Section — Interactive store/platform tiles
   Displays top stores with 3D tilt hover effects.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { getStoreLogo } from '../api/cheapshark.js';
import { refreshGrid } from './dealGrid.js';
import { observeReveal } from '../3d/scrollAnimator.js';

export function initPlatformSection({ stores }) {
  const container = $('#platform-section');
  if (!container) return;

  // Top priority stores
  const priorityIDs = ['1', '25', '7', '13'];
  const topStores = stores.filter(s => priorityIDs.includes(s.storeID));
  const otherStores = stores.filter(s => !priorityIDs.includes(s.storeID)).slice(0, 4);
  const displayStores = [...topStores, ...otherStores];

  if (displayStores.length === 0) {
    container.style.display = 'none';
    return;
  }

  renderPlatformSection(container, displayStores);
}

function renderPlatformSection(container, stores) {
  const sectionLabel = el('div', { class: 'section-label meta-label' }, 'Platforms');
  const sectionTitle = el('h2', { class: 'section-title display-h1' });
  sectionTitle.innerHTML = 'Browse by <span class="text-accent">Store</span>';

  const grid = el('div', { class: 'platform-grid' });

  stores.forEach((store, i) => {
    const logoUrl = getStoreLogo(store.images);
    const tile = el('div', {
      class: 'platform-tile reveal-item',
      style: `--i: ${i}`,
      dataset: { storeId: store.storeID },
    });

    tile.innerHTML = `
      <div class="platform-tile-icon">
        <img src="${logoUrl}" alt="${store.storeName}" />
      </div>
      <div class="platform-tile-info">
        <span class="platform-tile-name">${store.storeName}</span>
        <span class="platform-tile-cta meta-label">Browse Deals →</span>
      </div>
    `;

    // 3D tilt
    tile.addEventListener('mousemove', (e) => {
      const rect = tile.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * 8;
      const rotateY = (x - 0.5) * 8;
      tile.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    tile.addEventListener('mouseleave', () => {
      tile.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateY(0)';
    });

    // Click → filter grid by store
    tile.addEventListener('click', () => {
      refreshGrid({
        storeID: store.storeID,
        sortBy: 'Deal Rating',
        onSale: true,
      });

      // Scroll to deals grid
      const main = document.getElementById('main-content');
      if (main) {
        main.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    grid.appendChild(tile);
  });

  container.appendChild(sectionLabel);
  container.appendChild(sectionTitle);
  container.appendChild(grid);

  // Reveal animation
  setTimeout(() => {
    observeReveal(container.querySelectorAll('.reveal-item'));
  }, 100);
}

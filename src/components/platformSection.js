/* ============================================================
   Platform Section — AMIX Store Monoliths
   Interactive storefront pedestals (Steam, Epic, GOG, etc.)
   Filtering directly into the preserved Deals Catalog.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { getStoreLogo } from '../api/cheapshark.js';
import { refreshGrid } from './dealGrid.js';

export function initPlatformSection({ stores }) {
  const container = $('#stores');
  if (!container) return;

  const priorityIDs = ['1', '25', '7', '13', '11'];
  const topStores = stores.filter(s => priorityIDs.includes(s.storeID));
  const displayStores = topStores.length > 0 ? topStores : stores.slice(0, 5);

  container.innerHTML = `
    <div class="stores-inner">
      <div class="stores-header">
        <div class="meta-label">OFFICIAL STOREFRONTS // DIRECT SYNC</div>
        <h2 class="stores-title">Verified Platforms</h2>
        <p class="stores-sub">Official API endpoints with 0% markup. Select a storefront to inspect active sale events.</p>
      </div>

      <div class="stores-platform-grid">
        ${displayStores.map((store, i) => {
          const logoUrl = getStoreLogo(store.images);
          return `
            <button type="button" class="store-monolith-btn" data-store-id="${store.storeID}">
              <div class="store-monolith-glow"></div>
              <div class="store-monolith-icon">
                <img src="${logoUrl}" alt="${store.storeName}" />
              </div>
              <div class="store-monolith-info">
                <span class="store-monolith-name">${store.storeName}</span>
                <span class="store-monolith-tag meta-label">ACTIVE SALES →</span>
              </div>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach click filters
  container.querySelectorAll('.store-monolith-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const storeId = btn.dataset.storeId;
      refreshGrid({
        storeID: storeId,
        sortBy: 'Deal Rating',
        onSale: true,
      });

      const catalog = document.getElementById('catalog');
      if (catalog) {
        catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

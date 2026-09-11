/* ============================================================
   Store Tabs — Clean Horizontal Tab Bar
   All Stores, Steam, Epic Games, GOG, Humble Store, Fanatical
   Clicking updates deals instantly.
   ============================================================ */

import { $, el } from '../utils/dom.js';
import { getStoreLogo } from '../api/cheapshark.js';
import { refreshGrid } from './dealGrid.js';

const STORE_TABS = [
  { id: 'all', name: 'All Stores', storeID: null, icon: null },
  { id: 'steam', name: 'Steam', storeID: '1' },
  { id: 'epic', name: 'Epic Games', storeID: '25' },
  { id: 'gog', name: 'GOG', storeID: '7' },
  { id: 'humble', name: 'Humble Store', storeID: '11' },
  { id: 'fanatical', name: 'Fanatical', storeID: '15' },
];

let activeStoreId = 'all';

export function initPlatformSection({ stores }) {
  const container = $('#store-tabs') || $('#stores');
  if (!container) return;

  const storesMap = new Map();
  stores.forEach(s => storesMap.set(s.storeID, s));

  container.innerHTML = `
    <div class="store-tabs-inner">
      <div class="store-tabs-header">
        <div class="meta-label">06 // STOREFRONT INDEX</div>
        <h2 class="store-tabs-title">Verified Storefronts</h2>
        <p class="store-tabs-sub">Direct authorized merchant pricing with zero markup. Select a store to filter deals instantly.</p>
      </div>

      <!-- Horizontal Tab Bar -->
      <div class="store-tabs-bar" role="tablist" aria-label="Store Filter Tabs">
        ${STORE_TABS.map(tab => {
          const store = tab.storeID ? storesMap.get(tab.storeID) : null;
          const logo = tab.storeID ? getStoreLogo(tab.storeID) : null;
          const isActive = tab.id === activeStoreId;

          return `
            <button type="button" 
                    role="tab" 
                    aria-selected="${isActive}" 
                    class="store-tab-btn ${isActive ? 'active' : ''}" 
                    data-tab-id="${tab.id}" 
                    data-store-id="${tab.storeID || ''}">
              ${logo ? `<img src="${logo}" alt="" class="store-tab-icon" />` : `
                <span class="store-tab-all-icon meta-label">ALL</span>
              `}
              <span class="store-tab-name">${tab.name}</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;

  // Attach click listener
  container.querySelectorAll('.store-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tabId;
      const storeId = btn.dataset.storeId;
      activeStoreId = tabId;

      container.querySelectorAll('.store-tab-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      if (storeId) {
        refreshGrid({
          storeID: storeId,
          sortBy: 'Deal Rating',
          onSale: true,
        });
      } else {
        refreshGrid({
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

/* ============================================================
   Compact Store Tabs — Verified Platform Filter
   All Stores, Steam, Epic Games, GOG, Humble Store, Fanatical
   Clean horizontal pill tabs directly inside Discovery section.
   ============================================================ */

import { $ } from '../utils/dom.js';
import { getStoreLogo } from '../api/cheapshark.js';
import { refreshGrid } from './dealGrid.js';

const STORES = [
  { id: 'all', name: 'All Platforms', storeID: null },
  { id: 'steam', name: 'Steam', storeID: '1' },
  { id: 'epic', name: 'Epic Games', storeID: '25' },
  { id: 'gog', name: 'GOG', storeID: '7' },
  { id: 'humble', name: 'Humble Store', storeID: '11' },
  { id: 'fanatical', name: 'Fanatical', storeID: '15' },
];

let activeStoreId = 'all';

export function initPlatformSection({ stores }) {
  const container = $('#store-tabs');
  if (!container) return;

  const storesMap = new Map();
  stores.forEach(s => storesMap.set(s.storeID, s));

  container.innerHTML = `
    <div class="compact-store-tabs" role="tablist">
      ${STORES.map(s => {
        const logo = s.storeID ? getStoreLogo(s.storeID) : null;
        const isActive = s.id === activeStoreId;
        return `
          <button type="button" 
                  class="compact-store-btn ${isActive ? 'active' : ''}" 
                  data-store-id="${s.storeID || ''}"
                  data-tab-id="${s.id}">
            ${logo ? `<img src="${logo}" alt="" class="compact-store-icon" />` : ''}
            <span>${s.name}</span>
          </button>
        `;
      }).join('')}
    </div>
  `;

  container.querySelectorAll('.compact-store-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const storeId = btn.dataset.storeId;
      const tabId = btn.dataset.tabId;
      activeStoreId = tabId;

      container.querySelectorAll('.compact-store-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      if (storeId) {
        refreshGrid({ storeID: storeId, sortBy: 'Deal Rating', onSale: true });
      } else {
        refreshGrid({ sortBy: 'Deal Rating', onSale: true });
      }
    });
  });
}

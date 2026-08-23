/* ============================================================
   Filter Bar Component
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';

let activeFilters = {
  storeID: '1', // Steam as default highlighted store on entry
  sortBy: 'Deal Rating',
  lowerPrice: null,
  upperPrice: null,
  minSavings: null,
  title: null,
  onSale: true,
};

let onFilterChange = null;
let storesMap = new Map();

const sortOptions = [
  { value: 'Deal Rating', label: 'Best Deals' },
  { value: 'Savings', label: 'Highest Discount' },
  { value: 'Price', label: 'Lowest Price' },
  { value: 'Metacritic', label: 'Metacritic' },
  { value: 'Reviews', label: 'Reviews' },
  { value: 'Title', label: 'Title A-Z' },
  { value: 'Release', label: 'Newest' },
];

const USD_TO_INR = 83;

const priceRanges = [
  { label: 'Free', lower: 0, upper: 0 },
  { label: 'Under ₹500', lower: 0, upper: 500 / USD_TO_INR },
  { label: 'Under ₹1,000', lower: 0, upper: 1000 / USD_TO_INR },
  { label: 'Under ₹2,000', lower: 0, upper: 2000 / USD_TO_INR },
  { label: '₹2,000+', lower: 2000 / USD_TO_INR, upper: null },
];

const discountRanges = [
  { label: '50%+ Off', value: 50 },
  { label: '75%+ Off', value: 75 },
  { label: '90%+ Off', value: 90 },
];

export function initFilters({ stores, onChange }) {
  const filterBar = $('#filter-bar');
  if (!filterBar) return;

  onFilterChange = onChange;

  // Build stores map
  stores.forEach(s => storesMap.set(s.storeID, s));

  renderFilterBar(filterBar, stores);
}

function renderFilterBar(container, stores) {
  const inner = el('div', { class: 'filter-bar-inner' });

  // Store filter — default to Steam ('1')
  const steamStore = stores.find(s => s.storeID === '1');
  const initialStoreLabel = steamStore ? steamStore.storeName : 'Steam';

  inner.appendChild(createDropdownFilter('Store', 'store-filter', stores.map(s => ({
    value: s.storeID,
    label: s.storeName,
    icon: `https://www.cheapshark.com${s.images.icon}`,
  })), (selected) => {
    activeFilters.storeID = selected || null;
    emitChange();
  }, '1'));

  inner.appendChild(el('div', { class: 'filter-divider' }));

  // Discount quick chips
  discountRanges.forEach(d => {
    const chip = el('button', {
      class: 'filter-chip',
      dataset: { discount: d.value },
      onClick: () => {
        const isActive = chip.classList.contains('active');
        // Deactivate all discount chips
        inner.querySelectorAll('[data-discount]').forEach(c => c.classList.remove('active'));
        if (!isActive) {
          chip.classList.add('active');
          chip.classList.add('just-activated');
          setTimeout(() => chip.classList.remove('just-activated'), 200);
          activeFilters.minSavings = d.value;
        } else {
          activeFilters.minSavings = null;
        }
        emitChange();
      },
    }, d.label);
    inner.appendChild(chip);
  });

  inner.appendChild(el('div', { class: 'filter-divider' }));

  // Price range
  inner.appendChild(createDropdownFilter('Price', 'price-filter', priceRanges.map(p => ({
    value: `${p.lower}-${p.upper}`,
    label: p.label,
  })), (selected) => {
    if (selected) {
      const [lower, upper] = selected.split('-').map(v => v === 'null' ? null : parseFloat(v));
      activeFilters.lowerPrice = lower;
      activeFilters.upperPrice = upper;
    } else {
      activeFilters.lowerPrice = null;
      activeFilters.upperPrice = null;
    }
    emitChange();
  }));

  inner.appendChild(el('div', { class: 'filter-divider' }));

  // Sort
  inner.appendChild(createDropdownFilter('Sort', 'sort-filter', sortOptions.map(s => ({
    value: s.value,
    label: s.label,
  })), (selected) => {
    activeFilters.sortBy = selected || 'Deal Rating';
    emitChange();
  }, 'Deal Rating'));

  container.innerHTML = '';
  container.appendChild(inner);
}

function createDropdownFilter(label, id, options, onChange, defaultValue = null) {
  const wrapper = el('div', { class: 'filter-chip-wrapper' });

  const chip = el('button', {
    class: 'filter-chip',
    id: id,
    html: `${label} ${icons.chevronDown}`,
  });

  const dropdown = el('div', { class: 'filter-dropdown', id: `${id}-dropdown` });

  // "All" option
  const allItem = el('div', {
    class: `filter-dropdown-item${!defaultValue ? ' selected' : ''}`,
    onClick: () => {
      dropdown.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('selected'));
      allItem.classList.add('selected');
      chip.innerHTML = `${label} ${icons.chevronDown}`;
      chip.classList.remove('active');
      closeDropdown(dropdown);
      onChange(null);
    },
  }, `All ${label}s`);
  dropdown.appendChild(allItem);

  options.forEach(opt => {
    const item = el('div', {
      class: `filter-dropdown-item${opt.value === defaultValue ? ' selected' : ''}`,
      onClick: () => {
        dropdown.querySelectorAll('.filter-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        chip.innerHTML = `${opt.label} ${icons.chevronDown}`;
        chip.classList.add('active');
        chip.classList.add('just-activated');
        setTimeout(() => chip.classList.remove('just-activated'), 200);
        closeDropdown(dropdown);
        onChange(opt.value);
      },
    });

    if (opt.icon) {
      const img = el('img', { src: opt.icon, alt: opt.label });
      item.prepend(img);
    }

    item.appendChild(document.createTextNode(opt.label));
    dropdown.appendChild(item);
  });

  chip.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    closeAllDropdowns();
    if (!isOpen) {
      dropdown.classList.add('open');
    }
  });

  wrapper.appendChild(chip);
  wrapper.appendChild(dropdown);

  return wrapper;
}

function closeDropdown(dropdown) {
  dropdown.classList.remove('open');
}

function closeAllDropdowns() {
  document.querySelectorAll('.filter-dropdown.open').forEach(d => d.classList.remove('open'));
}

// Close dropdowns when clicking outside
document.addEventListener('click', closeAllDropdowns);

function emitChange() {
  if (onFilterChange) {
    onFilterChange({ ...activeFilters });
  }
}

export function getActiveFilters() {
  return { ...activeFilters };
}

export function resetFilters() {
  activeFilters = {
    storeID: null,
    sortBy: 'Deal Rating',
    lowerPrice: null,
    upperPrice: null,
    minSavings: null,
    title: null,
    onSale: true,
  };
  // Re-render will happen via initFilters
}

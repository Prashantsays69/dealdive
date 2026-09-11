/* ============================================================
   Header Component — AMIX-Style Minimal Navigation
   Clean Space Mono brand, 3D toggle, search, and wishlist.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { toggle3DMode } from '../3d/scene3d.js';

export function initHeader({ onSearchClick, onWishlistClick }) {
  const header = $('#site-header');
  if (!header) return;

  header.innerHTML = `
    <div class="site-head-inner">
      <a href="/" class="site-head-brand" id="header-brand">
        DEAL<span class="brand-accent">DIVE</span>
      </a>

      <div class="site-head-nav">
        <a href="#catalog" class="site-head-link" data-nav="deals">DEALS</a>
        <a href="#catalog" class="site-head-link" data-nav="popular">POPULAR</a>
        <button type="button" class="site-head-link" id="header-wishlist-btn" title="Wishlist">
          WISHLIST <span class="wishlist-badge" id="wishlist-count">0</span>
        </button>
      </div>

      <div class="site-head-right">
        <button type="button" class="gl-toggle-btn" id="glToggle" aria-pressed="true">
          3D <span>ON</span>
        </button>

        <button type="button" class="site-head-search-btn" id="header-search-btn" aria-label="Search games" title="Search (⌘K)">
          ${icons.search}
          <span class="search-kbd">⌘K</span>
        </button>
      </div>
    </div>
  `;

  // Scroll style change
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Search button
  $('#header-search-btn')?.addEventListener('click', onSearchClick);

  // Wishlist button
  $('#header-wishlist-btn')?.addEventListener('click', onWishlistClick);

  // 3D Toggle
  const toggleBtn = $('#glToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isNowOn = toggle3DMode();
      toggleBtn.setAttribute('aria-pressed', String(isNowOn));
      const span = toggleBtn.querySelector('span');
      if (span) {
        span.textContent = isNowOn ? 'ON' : 'OFF';
        span.style.color = isNowOn ? '#C8FF3D' : '#FF5B55';
      }
    });
  }

  // Nav links
  const navLinks = header.querySelectorAll('[data-nav]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const nav = link.dataset.nav;
      window.dispatchEvent(new CustomEvent('nav-change', { detail: { nav } }));

      // Smooth scroll to catalog
      const catalog = document.getElementById('catalog');
      if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Keyboard shortcut: / or Ctrl+K / Cmd+K
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' && !isInputFocused()) || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
      e.preventDefault();
      onSearchClick();
    }
  });
}

/**
 * Update wishlist count badge
 */
export function updateWishlistCount(count) {
  const badge = $('#wishlist-count');
  if (!badge) return;
  badge.textContent = count;
  badge.classList.toggle('has-items', count > 0);
}

function isInputFocused() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

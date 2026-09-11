/* ============================================================
   Header Component — Floating Dark Minimal Navbar
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';

export function initHeader({ onSearchClick, onWishlistClick }) {
  const header = $('#site-header');

  header.innerHTML = `
    <div class="header-inner">
      <a href="/" class="header-logo" id="header-logo">
        Deal<span class="logo-accent">Dive</span>
      </a>

      <nav class="header-nav" id="header-nav">
        <a href="#" class="active" data-nav="deals">Deals</a>
        <a href="#" data-nav="popular">Popular Games</a>
        <a href="#" data-nav="free">Free Games</a>
      </nav>

      <div class="header-actions">
        <button class="header-btn" id="header-search-btn" aria-label="Search games" title="Search">
          ${icons.search}
        </button>
        <button class="header-btn" id="header-wishlist-btn" aria-label="Wishlist" title="Wishlist">
          ${icons.heart}
          <span class="wishlist-count" id="wishlist-count" data-count="0"></span>
        </button>
        <button class="header-btn header-menu-btn" id="header-menu-btn" aria-label="Menu">
          ${icons.menu}
        </button>
      </div>
    </div>
  `;

  // Scroll — add scrolled class for backdrop
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;
    header.classList.toggle('scrolled', scrollY > 50);
    lastScroll = scrollY;
  }, { passive: true });

  // Search button
  $('#header-search-btn').addEventListener('click', onSearchClick);

  // Wishlist button
  $('#header-wishlist-btn').addEventListener('click', onWishlistClick);

  // Nav links — filter by type
  const navLinks = header.querySelectorAll('[data-nav]');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      const nav = link.dataset.nav;
      // Dispatch custom event for main.js to handle
      window.dispatchEvent(new CustomEvent('nav-change', { detail: { nav } }));
    });
  });

  // Keyboard shortcut: / or Ctrl+K to open search
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && !isInputFocused()) {
      e.preventDefault();
      onSearchClick();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
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
  badge.textContent = count > 0 ? count : '';
  badge.dataset.count = count;
}

function isInputFocused() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

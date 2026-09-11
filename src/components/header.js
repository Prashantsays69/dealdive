/* ============================================================
   Header Component — Denmu-Style Minimal Floating Navigation
   DealDive logo + Deals + Trending + Stores + Wishlist + Search
   + Compact mobile slide-out navigation.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { toggle3DMode } from '../3d/scene3d.js';

export function initHeader({ onSearchClick, onWishlistClick }) {
  const header = $('#site-header');
  const mobileDrawer = $('#mobile-nav-drawer');
  if (!header) return;

  header.innerHTML = `
    <div class="site-head-inner">
      <a href="/" class="site-head-brand" id="header-brand">
        DEAL<span class="brand-accent">DIVE</span>
      </a>

      <nav class="site-head-nav" aria-label="Main Navigation">
        <a href="#featured-deal" class="site-head-link" data-target="featured-deal">FEATURED</a>
        <a href="#best-deals" class="site-head-link" data-target="best-deals">DEALS</a>
        <a href="#trending" class="site-head-link" data-target="trending">TRENDING</a>
        <a href="#store-tabs" class="site-head-link" data-target="store-tabs">STORES</a>
        <button type="button" class="site-head-link wishlist-link-btn" id="header-wishlist-btn" title="Open Wishlist">
          WISHLIST <span class="wishlist-badge" id="wishlist-count">0</span>
        </button>
      </nav>

      <div class="site-head-right">
        <button type="button" class="gl-toggle-btn" id="glToggle" aria-pressed="true" title="Toggle 3D visual depth">
          3D <span>ON</span>
        </button>

        <button type="button" class="site-head-search-btn" id="header-search-btn" aria-label="Search games" title="Search games (⌘K)">
          ${icons.search}
          <span class="search-kbd">⌘K</span>
        </button>

        <!-- Mobile hamburger toggle -->
        <button type="button" class="mobile-nav-toggle" id="mobile-menu-btn" aria-label="Open mobile menu">
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    </div>
  `;

  // Render Mobile Navigation Drawer
  if (mobileDrawer) {
    mobileDrawer.innerHTML = `
      <div class="mobile-nav-backdrop" id="mobile-nav-backdrop"></div>
      <div class="mobile-nav-content">
        <div class="mobile-nav-top">
          <span class="mobile-nav-brand">DEAL<span class="brand-accent">DIVE</span></span>
          <button type="button" class="mobile-nav-close" id="mobile-nav-close" aria-label="Close menu">
            ${icons.x}
          </button>
        </div>

        <nav class="mobile-nav-links">
          <a href="#featured-deal" class="mobile-nav-item" data-target="featured-deal">
            <span class="mobile-nav-num">01</span>
            <span class="mobile-nav-label">FEATURED DEAL</span>
          </a>
          <a href="#best-deals" class="mobile-nav-item" data-target="best-deals">
            <span class="mobile-nav-num">02</span>
            <span class="mobile-nav-label">BEST DEALS</span>
          </a>
          <a href="#trending" class="mobile-nav-item" data-target="trending">
            <span class="mobile-nav-num">03</span>
            <span class="mobile-nav-label">TRENDING</span>
          </a>
          <a href="#deal-categories" class="mobile-nav-item" data-target="deal-categories">
            <span class="mobile-nav-num">04</span>
            <span class="mobile-nav-label">CATEGORIES</span>
          </a>
          <a href="#store-tabs" class="mobile-nav-item" data-target="store-tabs">
            <span class="mobile-nav-num">05</span>
            <span class="mobile-nav-label">STOREFRONTS</span>
          </a>
          <a href="#catalog" class="mobile-nav-item" data-target="catalog">
            <span class="mobile-nav-num">06</span>
            <span class="mobile-nav-label">ALL DEALS</span>
          </a>
        </nav>

        <div class="mobile-nav-bottom">
          <button type="button" class="mobile-nav-action-btn" id="mobile-wishlist-btn">
            ${icons.heart}
            <span>WISHLIST</span>
            <span class="wishlist-badge" id="mobile-wishlist-count">0</span>
          </button>
          <button type="button" class="mobile-nav-action-btn" id="mobile-search-btn">
            ${icons.search}
            <span>SEARCH GAMES</span>
          </button>
        </div>
      </div>
    `;

    const openMobile = () => {
      mobileDrawer.classList.add('open');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    };

    const closeMobile = () => {
      mobileDrawer.classList.remove('open');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    };

    $('#mobile-menu-btn')?.addEventListener('click', openMobile);
    $('#mobile-nav-close')?.addEventListener('click', closeMobile);
    $('#mobile-nav-backdrop')?.addEventListener('click', closeMobile);

    mobileDrawer.querySelectorAll('.mobile-nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobile();
        const targetId = item.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    $('#mobile-wishlist-btn')?.addEventListener('click', () => {
      closeMobile();
      onWishlistClick();
    });

    $('#mobile-search-btn')?.addEventListener('click', () => {
      closeMobile();
      onSearchClick();
    });
  }

  // Header scroll state
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 30);
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
        span.style.color = isNowOn ? '#C7FF3D' : '#FF5B55';
      }
    });
  }

  // Smooth scroll links
  header.querySelectorAll('.site-head-link[data-target]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.dataset.target;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
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
 * Update wishlist count badge in desktop and mobile header
 */
export function updateWishlistCount(count) {
  const badge = $('#wishlist-count');
  const mobBadge = $('#mobile-wishlist-count');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('has-items', count > 0);
  }
  if (mobBadge) {
    mobBadge.textContent = count;
    mobBadge.classList.toggle('has-items', count > 0);
  }
}

function isInputFocused() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

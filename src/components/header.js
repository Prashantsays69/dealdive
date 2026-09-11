/* ============================================================
   Minimal Nav — Denmu Editorial Navigation
   Logo + Deals / Trending / Stores / Wishlist + Search icon
   Clean, typography-driven, no dominating pills.
   ============================================================ */

import { $, icons } from '../utils/dom.js';
import { toggle3DMode } from '../3d/scene3d.js';

export function initHeader({ onSearchClick, onWishlistClick }) {
  const header = $('#site-header');
  const mobileDrawer = $('#mobile-nav-drawer');
  if (!header) return;

  header.innerHTML = `
    <div class="site-nav-container">
      <a href="/" class="site-brand" id="header-brand">
        DEAL<span class="brand-accent">DIVE</span>
      </a>

      <nav class="site-nav-links" aria-label="Primary Navigation">
        <a href="#featured" class="site-nav-item">Deals</a>
        <a href="#categories" class="site-nav-item">Trending</a>
        <a href="#discovery" class="site-nav-item" data-target="stores">Stores</a>
        <button type="button" class="site-nav-item site-nav-btn" id="header-wishlist-btn">
          Wishlist <span class="nav-wishlist-count" id="wishlist-count">0</span>
        </button>
      </nav>

      <div class="site-nav-actions">
        <button type="button" class="nav-gl-toggle" id="glToggle" aria-pressed="true" title="Toggle 3D Depth">
          3D <span class="gl-status-dot"></span>
        </button>

        <button type="button" class="nav-icon-btn" id="header-search-btn" aria-label="Search" title="Search games (⌘K)">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
        </button>

        <button type="button" class="nav-mobile-toggle" id="mobile-menu-btn" aria-label="Open Menu">
          <span></span>
          <span></span>
        </button>
      </div>
    </div>
  `;

  // Mobile Drawer
  if (mobileDrawer) {
    mobileDrawer.innerHTML = `
      <div class="mobile-drawer-backdrop" id="mobile-drawer-backdrop"></div>
      <div class="mobile-drawer-panel">
        <div class="mobile-drawer-head">
          <span class="site-brand">DEAL<span class="brand-accent">DIVE</span></span>
          <button type="button" class="mobile-drawer-close" id="mobile-drawer-close" aria-label="Close">
            ${icons.x}
          </button>
        </div>
        <div class="mobile-drawer-nav">
          <a href="#featured" class="mobile-drawer-link">Deals</a>
          <a href="#categories" class="mobile-drawer-link">Trending</a>
          <a href="#discovery" class="mobile-drawer-link">Stores</a>
          <a href="#discovery" class="mobile-drawer-link">Game Discovery</a>
        </div>
        <div class="mobile-drawer-foot">
          <button type="button" class="mobile-action-btn" id="mob-wishlist-btn">
            Wishlist (<span id="mob-wishlist-count">0</span>)
          </button>
          <button type="button" class="mobile-action-btn" id="mob-search-btn">
            Search games
          </button>
        </div>
      </div>
    `;

    const openDrawer = () => {
      mobileDrawer.classList.add('open');
      mobileDrawer.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');
    };
    const closeDrawer = () => {
      mobileDrawer.classList.remove('open');
      mobileDrawer.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
    };

    $('#mobile-menu-btn')?.addEventListener('click', openDrawer);
    $('#mobile-drawer-close')?.addEventListener('click', closeDrawer);
    $('#mobile-drawer-backdrop')?.addEventListener('click', closeDrawer);

    mobileDrawer.querySelectorAll('.mobile-drawer-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        closeDrawer();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });

    $('#mob-wishlist-btn')?.addEventListener('click', () => {
      closeDrawer();
      onWishlistClick();
    });
    $('#mob-search-btn')?.addEventListener('click', () => {
      closeDrawer();
      onSearchClick();
    });
  }

  // Smooth scroll links
  header.querySelectorAll('.site-nav-item[href]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetEl = document.querySelector(targetId);
      if (targetEl) targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Events
  $('#header-search-btn')?.addEventListener('click', onSearchClick);
  $('#header-wishlist-btn')?.addEventListener('click', onWishlistClick);

  // 3D toggle
  const toggleBtn = $('#glToggle');
  toggleBtn?.addEventListener('click', () => {
    const isNowOn = toggle3DMode();
    toggleBtn.setAttribute('aria-pressed', String(isNowOn));
    toggleBtn.classList.toggle('gl-off', !isNowOn);
  });

  // Scroll style
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Key shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.key === '/' && !isInputFocused()) || ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
      e.preventDefault();
      onSearchClick();
    }
  });
}

export function updateWishlistCount(count) {
  const badge = $('#wishlist-count');
  const mobBadge = $('#mob-wishlist-count');
  if (badge) badge.textContent = count;
  if (mobBadge) mobBadge.textContent = count;
}

function isInputFocused() {
  const el = document.activeElement;
  return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
}

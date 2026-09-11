/* ============================================================
   Immersive Hero — Denmu Editorial + AMIX 3D (RAWG Enriched)
   Oversized typography: "FIND YOUR NEXT GAME."
   Search bar, quick action buttons, and live featured spotlight.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { formatPrice } from '../utils/format.js';
import { fetchHeroDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isWebGLEnabled, getScene } from '../3d/scene3d.js';
import { openGameDetail } from './gameDetailModal.js';
import { toggleWishlist, isInWishlist } from './wishlist.js';
import * as THREE from 'three';

let heroGroup = null;

export async function initHeroImmersive({ onSearchClick, storesMap }) {
  const container = $('#hero');
  if (!container) return;

  renderHeroSkeleton(container, onSearchClick);

  try {
    const rawDeals = await fetchHeroDeals();
    if (rawDeals && rawDeals.length > 0) {
      // Enrich top deals with RAWG
      const enriched = await enrichDealsWithRAWG(rawDeals.slice(0, 3), 3);
      const topDeal = enriched[0];

      // Update spotlight card in DOM
      renderSpotlightCard(topDeal, storesMap);

      // WebGL 3D depth planes
      if (isWebGLEnabled()) {
        initHero3DPlanes(enriched);
      }
    }
  } catch (err) {
    console.error('Hero deals fetch failed:', err);
  }
}

function renderHeroSkeleton(container, onSearchClick) {
  container.innerHTML = `
    <div class="hero-editorial-container">
      <div class="hero-editorial-left">
        <div class="hero-eyebrow meta-label">
          <span class="status-pulse"></span>
          <span>CHEAPSHARK + RAWG INTELLIGENCE // REAL-TIME PC DEALS</span>
        </div>

        <h1 class="hero-headline">
          <span class="hero-headline-row">FIND YOUR</span>
          <span class="hero-headline-row text-accent">NEXT GAME.</span>
        </h1>

        <p class="hero-subtext">
          Real-time price comparisons across Steam, Epic Games, GOG, and verified storefronts.
          Enriched with RAWG visual intelligence and tracked at historic discounts.
        </p>

        <!-- Strong Search Bar -->
        <div class="hero-search-box">
          <div class="hero-search-input-group" id="hero-search-trigger">
            <svg class="hero-search-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input type="text" class="hero-search-input" id="hero-quick-search" placeholder="Search games, genres, stores..." autocomplete="off" />
            <button type="button" class="hero-search-submit-btn" id="hero-search-submit" aria-label="Search">
              <span>EXPLORE</span>
              <kbd class="hero-kbd">↵</kbd>
            </button>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="hero-actions">
          <a href="#catalog" class="hero-btn-primary" id="hero-explore-btn">
            <span>EXPLORE DEALS</span>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <polyline points="19 12 12 19 5 12"/>
            </svg>
          </a>
          <a href="#trending" class="hero-btn-secondary" id="hero-trending-btn">
            <span>TRENDING NOW</span>
          </a>
        </div>
      </div>

      <!-- Live Featured Spotlight Card -->
      <div class="hero-editorial-right" id="hero-spotlight-container">
        <div class="hero-spotlight-skeleton">
          <div class="skeleton-shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Scroll Indicator -->
    <div class="hero-scroll-indicator" aria-hidden="true">
      <div class="hero-scroll-line"></div>
      <span class="meta-label">SCROLL TO DISCOVER</span>
    </div>
  `;

  // Attach search handlers
  const quickSearch = $('#hero-quick-search');
  const searchSubmit = $('#hero-search-submit');

  const executeSearch = () => {
    const q = quickSearch?.value?.trim();
    if (q) {
      window.dispatchEvent(new CustomEvent('search-execute', { detail: { query: q } }));
      const catalog = document.getElementById('catalog');
      if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      onSearchClick();
    }
  };

  quickSearch?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  });

  searchSubmit?.addEventListener('click', executeSearch);

  // Smooth scroll buttons
  $('#hero-explore-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const catalog = document.getElementById('catalog');
    if (catalog) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  $('#hero-trending-btn')?.addEventListener('click', (e) => {
    e.preventDefault();
    const trending = document.getElementById('trending');
    if (trending) trending.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function renderSpotlightCard(deal, storesMap) {
  const container = $('#hero-spotlight-container');
  if (!container || !deal) return;

  const savings = Math.round(parseFloat(deal.savings));
  const salePrice = parseFloat(deal.salePrice);
  const normalPrice = parseFloat(deal.normalPrice);
  const isFree = salePrice === 0;
  const store = storesMap.get(deal.storeID);
  const storeName = store ? store.storeName : 'Steam';
  const storeLogo = getStoreLogo(deal.storeID);
  const gameImg = deal.heroImage || deal.gameImage || getHeroImage(deal) || getGameImage(deal);
  const dealLink = getDealLink(deal);
  const inWish = isInWishlist(deal.dealID);
  const rating = deal.rawgRating ? deal.rawgRating.toFixed(1) : (deal.metacriticScore ? deal.metacriticScore : null);

  container.innerHTML = `
    <div class="hero-spotlight-card" id="hero-spotlight-card" data-deal-id="${deal.dealID}">
      <div class="hero-spotlight-media">
        <img src="${gameImg}" alt="${deal.title}" class="hero-spotlight-img" />
        <div class="hero-spotlight-badges">
          <span class="spotlight-tag meta-label">SPOTLIGHT DEAL</span>
          <span class="spotlight-discount-badge">-${savings}%</span>
        </div>
      </div>

      <div class="hero-spotlight-body">
        <div class="hero-spotlight-header">
          <div class="hero-spotlight-store">
            ${storeLogo ? `<img src="${storeLogo}" alt="${storeName}" class="spotlight-store-logo" />` : ''}
            <span class="meta-label">${storeName}</span>
          </div>
          ${rating ? `<span class="spotlight-rating mono">★ ${rating}</span>` : ''}
        </div>

        <h3 class="hero-spotlight-title">${deal.title}</h3>

        <div class="hero-spotlight-price-row">
          <div class="hero-spotlight-prices">
            <span class="hero-spotlight-sale-price mono">${isFree ? 'FREE' : formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="hero-spotlight-normal-price mono">${formatPrice(deal.normalPrice)}</span>` : ''}
            <span class="hero-spotlight-savings meta-label">Save ${formatPrice(normalPrice - salePrice)}</span>
          </div>

          <div class="hero-spotlight-actions">
            <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="hero-spotlight-buy-btn" title="Direct store link" onclick="event.stopPropagation()">
              <span>GET DEAL</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </a>
            <button type="button" class="hero-spotlight-wish-btn ${inWish ? 'active' : ''}" data-deal-id="${deal.dealID}" aria-label="Add to wishlist" onclick="event.stopPropagation()">
              ${icons.heart}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Click card body -> opens Game Detail Modal
  const card = $('#hero-spotlight-card');
  card?.addEventListener('click', () => {
    openGameDetail(deal);
  });

  // Wishlist toggle
  const wishBtn = container.querySelector('.hero-spotlight-wish-btn');
  wishBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    const added = toggleWishlist(deal);
    wishBtn.classList.toggle('active', added);
  });
}

function initHero3DPlanes(deals) {
  const scene = getScene();
  if (!scene) return;

  if (heroGroup) {
    scene.remove(heroGroup);
  }

  heroGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const positions = [
    { x: 3.8, y: 1.4, z: -3.5, rx: 0.05, ry: -0.32, scale: 1.15 },
    { x: -4.2, y: -0.6, z: -5.5, rx: -0.04, ry: 0.35, scale: 1.25 },
    { x: 4.6, y: -2.0, z: -7.5, rx: 0.06, ry: -0.25, scale: 1.35 },
  ];

  deals.slice(0, 3).forEach((deal, idx) => {
    const pos = positions[idx];
    const imgUrl = deal.heroImage || deal.gameImage || getHeroImage(deal) || getGameImage(deal);
    if (!imgUrl) return;

    const planeGroup = new THREE.Group();

    // 1. Backing frame
    const frameGeo = new THREE.BoxGeometry(3.6 * pos.scale, 2.0 * pos.scale, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x141615,
      metalness: 0.6,
      roughness: 0.4,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    planeGroup.add(frameMesh);

    // 2. Subtle accent edge
    const edgeGeo = new THREE.BoxGeometry(3.64 * pos.scale, 2.04 * pos.scale, 0.03);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xC7FF3D,
      transparent: true,
      opacity: 0.35,
    });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    edgeMesh.position.z = -0.04;
    planeGroup.add(edgeMesh);

    // 3. Screen
    const screenGeo = new THREE.PlaneGeometry(3.5 * pos.scale, 1.9 * pos.scale);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x141615 });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.07;
    planeGroup.add(screenMesh);

    loader.load(
      imgUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        screenMesh.material = new THREE.MeshBasicMaterial({ map: tex });
      },
      undefined,
      (err) => {
        // Fallback gracefully without breaking scene
      }
    );

    planeGroup.position.set(pos.x, pos.y, pos.z);
    planeGroup.rotation.set(pos.rx, pos.ry, 0);

    heroGroup.add(planeGroup);
  });

  scene.add(heroGroup);
}

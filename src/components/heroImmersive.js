/* ============================================================
   Immersive Hero — AMIX 3D Entrance (RAWG Enriched)
   Oversized typography + RAWG high-resolution 3D artwork planes.
   ============================================================ */

import { $, el, icons } from '../utils/dom.js';
import { fetchHeroDeals, getHeroImage, getGameImage } from '../api/cheapshark.js';
import { enrichDealsWithRAWG } from '../api/rawg.js';
import { isWebGLEnabled, getScene } from '../3d/scene3d.js';
import * as THREE from 'three';

let heroGroup = null;

export async function initHeroImmersive({ onSearchClick, storesMap }) {
  const container = $('#hero');
  if (!container) return;

  renderHeroHTML(container, onSearchClick);

  try {
    const rawDeals = await fetchHeroDeals();
    if (rawDeals && rawDeals.length > 0) {
      // Enrich top deals with RAWG
      const enriched = await enrichDealsWithRAWG(rawDeals.slice(0, 3), 3);
      if (isWebGLEnabled()) {
        initHero3DPlanes(enriched);
      }
    }
  } catch (err) {
    console.error('Hero deals fetch failed:', err);
  }
}

function renderHeroHTML(container, onSearchClick) {
  container.innerHTML = `
    <div class="hero-inner">
      <div class="hero-eyebrow meta-label">
        <span class="status-pulse"></span>
        CHEAPSHARK + RAWG INTELLIGENCE // REAL-TIME PC DEALS
      </div>

      <h1 class="hero-title">
        <span class="hero-title-line">FIND THE BEST</span>
        <span class="hero-title-line text-accent">GAME DEALS.</span>
      </h1>

      <p class="hero-lead">
        Real-time price comparisons across Steam, Epic Games, GOG and official storefronts.
        Enriched with RAWG visual intelligence and tracked in interactive 3D depth.
      </p>

      <div class="hero-search-wrapper">
        <button type="button" class="hero-search-btn" id="hero-search-btn" aria-label="Search games">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <span class="hero-search-placeholder">Search games, franchises, or publishers...</span>
          <kbd class="hero-search-kbd">⌘K</kbd>
        </button>
      </div>

      <div class="hero-scroll" aria-hidden="true">
        <span class="hero-scroll-bar"></span>
        <span class="hero-scroll-text">SCROLL</span>
      </div>
    </div>
  `;

  $('#hero-search-btn')?.addEventListener('click', onSearchClick);
}

function initHero3DPlanes(deals) {
  const scene = getScene();
  if (!scene) return;

  heroGroup = new THREE.Group();
  const loader = new THREE.TextureLoader();
  loader.crossOrigin = 'anonymous';

  const positions = [
    { x: 3.2, y: 1.2, z: -2.0, rx: 0.05, ry: -0.35, scale: 1.1 },
    { x: -3.8, y: -0.5, z: -5.0, rx: -0.05, ry: 0.4, scale: 1.3 },
    { x: 4.2, y: -1.6, z: -7.0, rx: 0.08, ry: -0.28, scale: 1.4 },
  ];

  deals.slice(0, 3).forEach((deal, idx) => {
    const pos = positions[idx];
    const imgUrl = deal.heroImage || deal.gameImage || getHeroImage(deal) || getGameImage(deal);
    if (!imgUrl) return;

    const planeGroup = new THREE.Group();

    // 1. Backing bevel frame
    const frameGeo = new THREE.BoxGeometry(3.6 * pos.scale, 2.0 * pos.scale, 0.12);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x141414,
      metalness: 0.6,
      roughness: 0.4,
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    planeGroup.add(frameMesh);

    // 2. Neon edge
    const edgeGeo = new THREE.BoxGeometry(3.64 * pos.scale, 2.04 * pos.scale, 0.03);
    const edgeMat = new THREE.MeshBasicMaterial({
      color: 0xC8FF3D,
      transparent: true,
      opacity: 0.4,
    });
    const edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
    edgeMesh.position.z = -0.04;
    planeGroup.add(edgeMesh);

    // 3. Screen
    const screenGeo = new THREE.PlaneGeometry(3.5 * pos.scale, 1.9 * pos.scale);
    const screenMat = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
    const screenMesh = new THREE.Mesh(screenGeo, screenMat);
    screenMesh.position.z = 0.07;
    planeGroup.add(screenMesh);

    loader.load(imgUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      screenMesh.material = new THREE.MeshBasicMaterial({ map: tex });
    });

    planeGroup.position.set(pos.x, pos.y, pos.z);
    planeGroup.rotation.set(pos.rx, pos.ry, 0);

    heroGroup.add(planeGroup);
  });

  scene.add(heroGroup);
}

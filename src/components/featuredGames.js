/* ============================================================
   Featured Games — Scroll-driven cinematic game showcases
   Each game becomes a full-screen scene with artwork in depth.
   ============================================================ */

import { $, el } from '../utils/dom.js';
import { formatPrice, formatDiscount } from '../utils/format.js';
import { fetchHeroDeals, getHeroImage, getGameImage, getDealLink, getStoreLogo } from '../api/cheapshark.js';
import { isWebGLEnabled, addToScene, registerSection } from '../3d/scene3d.js';
import { createImagePlane } from '../3d/imageplane.js';
import { createScrollTrigger, mapRange, lerp } from '../3d/scrollAnimator.js';
import { isInWishlist, toggleWishlist } from './wishlist.js';

let featuredDeals = [];
let featuredPlanes = [];

export async function initFeaturedGames({ storesMap }) {
  const container = $('#featured-games');
  if (!container) return;

  try {
    featuredDeals = await fetchHeroDeals();
  } catch (err) {
    console.error('Featured games fetch failed:', err);
    return;
  }

  if (!featuredDeals || featuredDeals.length === 0) {
    container.style.display = 'none';
    return;
  }

  // Limit to 5 featured games
  featuredDeals = featuredDeals.slice(0, 5);

  renderFeaturedGames(container, storesMap);

  // Init 3D planes if available
  if (isWebGLEnabled()) {
    await initFeatured3D(container);
  }
}

function renderFeaturedGames(container, storesMap) {
  const sectionLabel = el('div', { class: 'section-label meta-label' }, 'Featured Games');

  const gamesWrapper = el('div', { class: 'featured-games-wrapper' });

  featuredDeals.forEach((deal, i) => {
    const savings = Math.round(parseFloat(deal.savings));
    const salePrice = parseFloat(deal.salePrice);
    const normalPrice = parseFloat(deal.normalPrice);
    const isFree = salePrice === 0;
    const store = storesMap.get(deal.storeID);
    const storeName = store ? store.storeName : '';
    const dealLink = getDealLink(deal);
    const heroImg = getHeroImage(deal);
    const fallbackImg = getGameImage(deal);

    const scene = el('div', {
      class: 'featured-game-scene',
      dataset: { index: i },
    });

    scene.innerHTML = `
      <div class="featured-game-bg">
        <img src="${heroImg}" alt="${deal.title}" loading="lazy"
             onerror="this.src='${fallbackImg}'" />
        <div class="featured-game-bg-overlay"></div>
      </div>
      <div class="featured-game-content">
        <div class="featured-game-index meta-label">${String(i + 1).padStart(2, '0')}</div>
        <div class="featured-game-info">
          <span class="featured-game-store meta-label">${storeName}</span>
          <h2 class="featured-game-title">${deal.title}</h2>
          <div class="featured-game-pricing">
            ${savings > 0 ? `<span class="featured-game-discount">-${savings}%</span>` : ''}
            <span class="featured-game-price">${formatPrice(deal.salePrice)}</span>
            ${normalPrice > salePrice ? `<span class="featured-game-original">${formatPrice(deal.normalPrice)}</span>` : ''}
          </div>
          <a href="${dealLink}" target="_blank" rel="noopener noreferrer" class="featured-game-cta">
            View Deal
            <svg viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </a>
        </div>
      </div>
    `;

    gamesWrapper.appendChild(scene);
  });

  container.appendChild(sectionLabel);
  container.appendChild(gamesWrapper);

  // Set up scroll reveals
  setTimeout(() => {
    const scenes = container.querySelectorAll('.featured-game-scene');
    scenes.forEach(scene => {
      createScrollTrigger({
        element: scene,
        startOffset: 0.1,
        endOffset: 0.6,
        onUpdate: (progress) => {
          scene.style.setProperty('--reveal-progress', progress);
          if (progress > 0.05) {
            scene.classList.add('in-view');
          }
        },
      });
    });
  }, 200);
}

async function initFeatured3D(container) {
  for (let i = 0; i < featuredDeals.length; i++) {
    const deal = featuredDeals[i];
    const imageUrl = getHeroImage(deal);

    try {
      const plane = await createImagePlane(imageUrl, {
        width: 3,
        opacity: 0,
      });

      plane.position.set(
        3 + (i % 2) * 1.5,
        -10 - i * 8,
        -4 - i * 0.5
      );
      plane.rotation.y = -0.15;

      plane.userData.sectionIndex = i;
      plane.userData.baseY = plane.position.y;

      addToScene(plane);
      featuredPlanes.push(plane);
    } catch (err) {
      // Texture load failed, skip this plane
    }
  }

  if (featuredPlanes.length > 0) {
    registerSection({
      id: 'featured',
      update: (scrollProg, mx, my, elapsed) => {
        featuredPlanes.forEach((plane, i) => {
          // Fade in/out based on scroll
          const sectionStart = 0.08 + i * 0.1;
          const sectionEnd = sectionStart + 0.12;
          const visibility = mapRange(scrollProg, sectionStart, sectionEnd, 0, 1);

          plane.material.opacity = Math.min(visibility, 0.7);
          plane.position.x = 3 + mx * 0.3;
          plane.position.y = plane.userData.baseY + Math.sin(elapsed * 0.4 + i) * 0.15;
          plane.rotation.y = -0.15 + mx * 0.03;
        });
      },
    });
  }
}

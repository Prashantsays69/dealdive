/* ============================================================
   ImagePlane — Creates textured PlaneGeometry meshes from
   game artwork URLs for use in the 3D scene
   ============================================================ */

import { THREE, loadTexture } from './scene3d.js';

/**
 * Create a textured plane mesh from an image URL
 * @param {string} imageUrl - URL of the image
 * @param {Object} options
 * @param {number} [options.width] - Plane width (default: 4)
 * @param {number} [options.height] - Plane height (default: auto from aspect)
 * @param {number} [options.aspect] - Aspect ratio w/h (default: 16/9)
 * @param {number} [options.opacity] - Initial opacity (default: 1)
 * @returns {Promise<THREE.Mesh>}
 */
export async function createImagePlane(imageUrl, options = {}) {
  const {
    width = 4,
    aspect = 460 / 215,
    opacity = 1,
  } = options;

  const height = width / aspect;

  const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

  // Create material with placeholder first
  const material = new THREE.MeshStandardMaterial({
    color: 0x141414,
    transparent: true,
    opacity: opacity,
    side: THREE.FrontSide,
    roughness: 0.5,
    metalness: 0.1,
    emissive: 0x111111,
    emissiveIntensity: 0.3,
  });

  const mesh = new THREE.Mesh(geometry, material);

  // Load texture asynchronously
  try {
    const texture = await loadTexture(imageUrl);
    material.map = texture;
    material.emissiveMap = texture;
    material.emissiveIntensity = 0.15;
    material.color.setHex(0xffffff);
    material.needsUpdate = true;
  } catch (err) {
    // Keep dark placeholder on failure
    console.warn('Failed to load texture:', imageUrl);
  }

  return mesh;
}

/**
 * Create multiple image planes arranged in a depth layout
 * @param {Array<string>} imageUrls
 * @param {Object} layout
 * @returns {Promise<THREE.Group>}
 */
export async function createImagePlaneGroup(imageUrls, layout = {}) {
  const {
    spacing = 2.5,
    depthSpacing = 2,
    startZ = -2,
    maxWidth = 5,
    scaleVariation = 0.3,
  } = layout;

  const group = new THREE.Group();

  const planes = await Promise.allSettled(
    imageUrls.map((url, i) =>
      createImagePlane(url, {
        width: maxWidth - i * scaleVariation,
        opacity: 1 - i * 0.1,
      })
    )
  );

  planes.forEach((result, i) => {
    if (result.status !== 'fulfilled') return;
    const mesh = result.value;

    // Staggered depth layout
    mesh.position.set(
      (i % 2 === 0 ? 1 : -1) * (1 + i * 0.5),
      (i - planes.length / 2) * 0.3,
      startZ - i * depthSpacing
    );

    // Slight rotation for depth feel
    mesh.rotation.y = (i % 2 === 0 ? 1 : -1) * 0.08;
    mesh.rotation.x = -0.02;

    mesh.userData.basePosition = mesh.position.clone();
    mesh.userData.baseRotation = mesh.rotation.clone();
    mesh.userData.parallaxFactor = 0.5 + i * 0.2;

    group.add(mesh);
  });

  return group;
}

/**
 * Update planes for mouse parallax
 */
export function updatePlanesParallax(group, mouseX, mouseY) {
  if (!group) return;
  group.children.forEach(mesh => {
    if (!mesh.userData.basePosition) return;
    const factor = mesh.userData.parallaxFactor || 1;

    mesh.position.x = mesh.userData.basePosition.x + mouseX * factor * 0.15;
    mesh.position.y = mesh.userData.basePosition.y - mouseY * factor * 0.1;
    mesh.rotation.y = mesh.userData.baseRotation.y + mouseX * 0.02 * factor;
    mesh.rotation.x = mesh.userData.baseRotation.x + mouseY * 0.01 * factor;
  });
}

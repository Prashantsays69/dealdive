/* ============================================================
   Scene3D — Core Three.js Scene Manager
   Manages a single full-viewport WebGL canvas behind all HTML.
   Provides scroll-driven camera, mouse parallax, and section
   registration for immersive 3D effects.
   ============================================================ */

import * as THREE from 'three';

let scene, camera, renderer, canvas;
let mouseX = 0, mouseY = 0;
let targetMouseX = 0, targetMouseY = 0;
let scrollProgress = 0;
let targetScrollProgress = 0;
let isLowPerf = false;
let animationId = null;
let registeredSections = [];
let ambientObjects = [];
let clock;
let isInitialized = false;

/**
 * Detect if device is low-performance
 */
function detectPerformance() {
  const cores = navigator.hardwareConcurrency || 2;
  const dpr = window.devicePixelRatio || 1;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isLowRes = window.innerWidth < 768;
  
  // Low perf: mobile with fewer than 4 cores, or very low-res
  return (isMobile && cores < 4) || (isLowRes && cores < 4) || (dpr < 1);
}

/**
 * Initialize the 3D scene
 */
export function initScene3D() {
  isLowPerf = detectPerformance();
  
  if (isLowPerf) {
    document.body.classList.add('no-webgl');
    return;
  }

  clock = new THREE.Clock();

  // Create canvas
  canvas = document.getElementById('three-canvas');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'three-canvas';
    document.body.prepend(canvas);
  }

  // Scene
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x080808, 0.035);

  // Camera
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );
  camera.position.set(0, 0, 5);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x080808, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;

  // Style canvas
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: -1;
    pointer-events: none;
  `;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Subtle accent-colored point light
  const accentLight = new THREE.PointLight(0xC8FF3D, 0.3, 30);
  accentLight.position.set(-3, 2, 3);
  scene.add(accentLight);

  // Create ambient floating geometry
  createAmbientGeometry();

  // Events
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  isInitialized = true;

  // Start render loop
  animate();
}

/**
 * Create ambient floating wireframe geometry in deep background
 */
function createAmbientGeometry() {
  const geometries = [
    new THREE.IcosahedronGeometry(0.6, 1),
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.TorusGeometry(0.4, 0.15, 8, 6),
    new THREE.TetrahedronGeometry(0.4, 0),
    new THREE.IcosahedronGeometry(0.3, 0),
    new THREE.DodecahedronGeometry(0.35, 0),
    new THREE.OctahedronGeometry(0.4, 0),
    new THREE.TorusKnotGeometry(0.25, 0.08, 32, 4, 2, 3),
  ];

  const material = new THREE.MeshBasicMaterial({
    color: 0xC8FF3D,
    wireframe: true,
    transparent: true,
    opacity: 0.06,
  });

  const materialDim = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true,
    transparent: true,
    opacity: 0.03,
  });

  for (let i = 0; i < 12; i++) {
    const geo = geometries[i % geometries.length];
    const mat = i % 3 === 0 ? material : materialDim;
    const mesh = new THREE.Mesh(geo, mat.clone());

    mesh.position.set(
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 40,
      -5 - Math.random() * 15
    );
    mesh.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    mesh.userData.rotSpeed = {
      x: (Math.random() - 0.5) * 0.003,
      y: (Math.random() - 0.5) * 0.003,
      z: (Math.random() - 0.5) * 0.002,
    };
    mesh.userData.floatSpeed = 0.2 + Math.random() * 0.3;
    mesh.userData.floatOffset = Math.random() * Math.PI * 2;
    mesh.userData.baseY = mesh.position.y;

    scene.add(mesh);
    ambientObjects.push(mesh);
  }
}

function onMouseMove(e) {
  targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
  targetMouseY = (e.clientY / window.innerHeight) * 2 - 1;
}

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScrollProgress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Main animation loop
 */
function animate() {
  animationId = requestAnimationFrame(animate);

  if (!renderer || !scene || !camera) return;

  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();

  // Smooth mouse follow
  mouseX += (targetMouseX - mouseX) * 0.05;
  mouseY += (targetMouseY - mouseY) * 0.05;

  // Smooth scroll follow
  scrollProgress += (targetScrollProgress - scrollProgress) * 0.08;

  // Camera subtle mouse parallax
  camera.position.x = mouseX * 0.3;
  camera.position.y = -mouseY * 0.2;
  camera.lookAt(0, 0, 0);

  // Animate ambient geometry
  ambientObjects.forEach((obj) => {
    obj.rotation.x += obj.userData.rotSpeed.x;
    obj.rotation.y += obj.userData.rotSpeed.y;
    obj.rotation.z += obj.userData.rotSpeed.z;

    // Gentle float
    obj.position.y = obj.userData.baseY +
      Math.sin(elapsed * obj.userData.floatSpeed + obj.userData.floatOffset) * 0.3;
  });

  // Update registered sections
  registeredSections.forEach(section => {
    if (section.update) {
      section.update(scrollProgress, mouseX, mouseY, elapsed);
    }
  });

  renderer.render(scene, camera);
}

/**
 * Register a section's 3D objects and update callback
 */
export function registerSection(config) {
  registeredSections.push(config);
}

/**
 * Get the Three.js scene for adding objects
 */
export function getScene() {
  return scene;
}

/**
 * Get the camera
 */
export function getCamera() {
  return camera;
}

/**
 * Check if WebGL is enabled
 */
export function isWebGLEnabled() {
  return isInitialized && !isLowPerf;
}

/**
 * Add an object to the scene
 */
export function addToScene(object) {
  if (scene) scene.add(object);
}

/**
 * Remove an object from the scene
 */
export function removeFromScene(object) {
  if (scene) scene.remove(object);
}

/**
 * Create a texture from image URL
 */
export function loadTexture(url) {
  return new Promise((resolve, reject) => {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        resolve(texture);
      },
      undefined,
      reject
    );
  });
}

/**
 * Get current scroll progress (0-1)
 */
export function getScrollProgress() {
  return scrollProgress;
}

/**
 * Dispose and cleanup
 */
export function disposeScene() {
  if (animationId) cancelAnimationFrame(animationId);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);

  ambientObjects.forEach(obj => {
    obj.geometry.dispose();
    obj.material.dispose();
    scene.remove(obj);
  });

  if (renderer) renderer.dispose();
}

export { THREE };

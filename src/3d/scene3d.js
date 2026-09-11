/* ============================================================
   DealDive — Core Three.js Scene Engine (AMIX Architecture)
   Implements scroll-driven 3D camera choreography, keyframe
   lerping, mouse parallax depth, and 3D deal showcases.
   ============================================================ */

import * as THREE from 'three';

let canvas, renderer, scene, camera, clock;
let inited = false;
let running = false;
let animationId = null;

// Devices & State
const isMobile = window.innerWidth <= 768;
let glOn = true;

// Camera poses mapped by section data-cam
let camPoses = {};
let keyframes = [];

const camState = {
  pos: new THREE.Vector3(0, 1.4, 10),
  look: new THREE.Vector3(0, 1.0, -5),
  targetPos: new THREE.Vector3(0, 1.4, 10),
  targetLook: new THREE.Vector3(0, 1.0, -5),
  mouse: new THREE.Vector2(0, 0),
  mouseSmooth: new THREE.Vector2(0, 0),
  lerpSpeed: 0.055,
};

// Registered 3D meshes for deals, trending, etc.
let dealMeshes = [];
let ambientParticles = null;
let landmarkSign = null;

/* ---------- Progress Bar ---------- */
let progressBar = null;
function updateProgress() {
  if (!progressBar) progressBar = document.getElementById('scroll-progress');
  if (!progressBar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  progressBar.style.transform = `scaleX(${p})`;
}

/* ---------- Texture Helper ---------- */
function makeGlowTexture(colorHex) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, colorHex);
  g.addColorStop(0.35, colorHex + 'aa');
  g.addColorStop(1, '#00000000');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeCanvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

/* ---------- Landmark Sign ---------- */
function createLandmarkSign(zPos) {
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 2048;
  signCanvas.height = 512;
  const ctx = signCanvas.getContext('2d');

  ctx.fillStyle = 'rgba(8, 8, 8, 0)';
  ctx.fillRect(0, 0, 2048, 512);

  // Glow text
  ctx.textAlign = 'center';
  ctx.shadowColor = '#C8FF3D';
  ctx.shadowBlur = 40;
  ctx.fillStyle = '#C8FF3D';
  ctx.font = '900 130px Inter, sans-serif';
  ctx.fillText('DEALDIVE', 1024, 220);

  ctx.shadowBlur = 20;
  ctx.fillStyle = '#F2F0EA';
  ctx.font = '700 48px Space Mono, monospace';
  ctx.letterSpacing = '10px';
  ctx.fillText('NEVER OVERPAY FOR GAMES', 1024, 320);

  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;

  const geo = new THREE.PlaneGeometry(16, 4);
  const mat = new THREE.MeshBasicMaterial({
    map: signTex,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(0, 5.0, zPos);
  return mesh;
}

/* ---------- 3D Deal Composition Builder ---------- */
export function buildDealComposition(deal, index, imageUrl) {
  const group = new THREE.Group();
  const side = index % 2 === 0 ? 1 : -1;
  const z = -8 - index * 9; // Spaced along Z axis

  // 1. Shadow Ground
  const shadowGeo = new THREE.PlaneGeometry(5.5, 3.2);
  const shadowMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture('#000000'),
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(shadowGeo, shadowMat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, -1.6, 0.4);
  group.add(shadow);

  // 2. Beveled Backing Frame
  const frameGeo = new THREE.BoxGeometry(4.4, 2.5, 0.22);
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x141414,
    metalness: 0.8,
    roughness: 0.35,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.position.set(0, 0, 0);
  group.add(frame);

  // 3. Glowing Accent Rim (#C8FF3D)
  const rimGeo = new THREE.BoxGeometry(4.48, 2.58, 0.05);
  const rimMat = new THREE.MeshBasicMaterial({
    color: 0xC8FF3D,
    transparent: true,
    opacity: 0.8,
  });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.set(0, 0, -0.05);
  group.add(rim);

  // 4. Subtle Backlight Glow
  const glowGeo = new THREE.PlaneGeometry(6.5, 4.2);
  const glowMat = new THREE.MeshBasicMaterial({
    map: makeGlowTexture('#C8FF3D'),
    color: 0xC8FF3D,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.set(0, 0, -0.1);
  group.add(glow);

  // 5. Artwork Screen (Textured Plane)
  const screenGeo = new THREE.PlaneGeometry(4.2, 2.3);
  const screenMat = new THREE.MeshBasicMaterial({
    color: 0x222222,
  });

  const screen = new THREE.Mesh(screenGeo, screenMat);
  screen.position.set(0, 0, 0.12);
  group.add(screen);

  // Load Image Texture
  if (imageUrl) {
    const loader = new THREE.TextureLoader();
    loader.crossOrigin = 'anonymous';
    loader.load(
      imageUrl,
      (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        screen.material = new THREE.MeshBasicMaterial({
          map: tex,
        });
      },
      undefined,
      (err) => {
        console.warn('Failed to load 3D texture for deal:', deal.title, err);
      }
    );
  }

  // Positioning
  const xOffset = isMobile ? 0 : side * 2.8;
  const yOffset = isMobile ? 1.0 : 0.6;
  const rotY = isMobile ? 0 : -side * 0.35;
  const rotX = 0.04;

  group.position.set(xOffset, yOffset, z);
  group.rotation.set(rotX, rotY, 0);

  group.userData = {
    index,
    side,
    baseZ: z,
    baseRotY: rotY,
    floatSpeed: 0.8 + index * 0.2,
    floatOffset: index * 1.5,
  };

  scene.add(group);
  dealMeshes.push(group);

  return group;
}

/* ---------- Camera Choreography ---------- */
function buildCamPoses() {
  const zLast = -62;

  if (isMobile) {
    camPoses = {
      hero: { pos: new THREE.Vector3(0, 1.2, 7.5), look: new THREE.Vector3(0, 1.0, -6) },
      'deal-01': { pos: new THREE.Vector3(0, 2.2, -4.5), look: new THREE.Vector3(0, 0.6, -8.5) },
      'deal-02': { pos: new THREE.Vector3(0, 2.2, -13.5), look: new THREE.Vector3(0, 0.6, -17.5) },
      'deal-03': { pos: new THREE.Vector3(0, 2.2, -22.5), look: new THREE.Vector3(0, 0.6, -26.5) },
      'deal-04': { pos: new THREE.Vector3(0, 2.2, -31.5), look: new THREE.Vector3(0, 0.6, -35.5) },
      trending: { pos: new THREE.Vector3(0, 2.5, -39.0), look: new THREE.Vector3(0, 0.8, -44.0) },
      stores: { pos: new THREE.Vector3(0, 2.0, -47.0), look: new THREE.Vector3(0, 0.5, -51.0) },
      catalog: { pos: new THREE.Vector3(0, 1.5, -53.0), look: new THREE.Vector3(0, 0.5, -59.0) },
      cta: { pos: new THREE.Vector3(0, 2.8, -58.0), look: new THREE.Vector3(0, 2.0, -65.0) },
      foot: { pos: new THREE.Vector3(0, 3.5, -60.0), look: new THREE.Vector3(0, 3.0, -68.0) },
    };
    return;
  }

  // Desktop Cinematic Angles (AMIX style alternating perspective)
  camPoses = {
    hero: { pos: new THREE.Vector3(0, 1.4, 8.5), look: new THREE.Vector3(0, 1.0, -5.0) },
    'deal-01': { pos: new THREE.Vector3(-1.8, 1.3, -4.5), look: new THREE.Vector3(2.4, 0.8, -8.5) },
    'deal-02': { pos: new THREE.Vector3(1.8, 1.3, -13.5), look: new THREE.Vector3(-2.4, 0.8, -17.5) },
    'deal-03': { pos: new THREE.Vector3(-1.9, 1.5, -22.5), look: new THREE.Vector3(2.4, 0.7, -26.5) },
    'deal-04': { pos: new THREE.Vector3(1.8, 1.3, -31.5), look: new THREE.Vector3(-2.4, 0.8, -35.5) },
    trending: { pos: new THREE.Vector3(0, 3.2, -37.5), look: new THREE.Vector3(0, 0.6, -44.0) },
    stores: { pos: new THREE.Vector3(0, 2.2, -46.5), look: new THREE.Vector3(0, 0.8, -52.0) },
    catalog: { pos: new THREE.Vector3(0, 1.2, -53.0), look: new THREE.Vector3(0, 0.6, -58.0) },
    cta: { pos: new THREE.Vector3(0, 4.0, -58.0), look: new THREE.Vector3(0, 4.5, -66.0) },
    foot: { pos: new THREE.Vector3(0, 4.5, -59.0), look: new THREE.Vector3(0, 4.8, -68.0) },
  };
}

export function measureKeyframes() {
  keyframes = [];
  document.querySelectorAll('.section').forEach((sec) => {
    const kind = sec.dataset.cam;
    const pose = camPoses[kind];
    if (!pose) return;
    const rect = sec.getBoundingClientRect();
    keyframes.push({
      id: kind,
      center: rect.top + window.scrollY + rect.height / 2,
      pose,
    });
  });

  keyframes.sort((a, b) => a.center - b.center);
}

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function poseAtScroll() {
  if (!keyframes.length) return;
  const y = window.scrollY + window.innerHeight / 2;

  let a = keyframes[0];
  let b = keyframes[0];

  for (let i = 0; i < keyframes.length; i++) {
    if (keyframes[i].center <= y) {
      a = keyframes[i];
      b = keyframes[Math.min(i + 1, keyframes.length - 1)];
    }
  }

  const span = Math.max(1, b.center - a.center);
  const t = smoothstep(Math.min(1, Math.max(0, (y - a.center) / span)));

  camState.targetPos.lerpVectors(a.pose.pos, b.pose.pos, t);
  camState.targetLook.lerpVectors(a.pose.look, b.pose.look, t);
}

/* ---------- Setup Lights & Environment ---------- */
function setupEnvironment() {
  // Ambient & Hemisphere
  const hemi = new THREE.HemisphereLight(0x181a20, 0x080808, 1.2);
  scene.add(hemi);

  // Key light with subtle warm tint
  const keyLight = new THREE.DirectionalLight(0xF2F0EA, 1.4);
  keyLight.position.set(-6, 12, 10);
  scene.add(keyLight);

  // Accent light in #C8FF3D
  const accentLight = new THREE.PointLight(0xC8FF3D, 25, 45);
  accentLight.position.set(4, 6, -10);
  scene.add(accentLight);

  const accentLight2 = new THREE.PointLight(0xC8FF3D, 20, 45);
  accentLight2.position.set(-4, 6, -30);
  scene.add(accentLight2);

  // Ambient floating dust particles
  const pCount = isMobile ? 120 : 350;
  const pGeo = new THREE.BufferGeometry();
  const pos = new Float32Array(pCount * 3);

  for (let i = 0; i < pCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = Math.random() * 10 - 2;
    pos[i * 3 + 2] = 12 - Math.random() * 80;
  }
  pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));

  const pMat = new THREE.PointsMaterial({
    size: 0.05,
    color: 0xC8FF3D,
    transparent: true,
    opacity: 0.45,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  ambientParticles = new THREE.Points(pGeo, pMat);
  scene.add(ambientParticles);

  // Ground Grid Matrix
  const gridHelper = new THREE.GridHelper(90, 45, 0x222222, 0x111111);
  gridHelper.position.set(0, -2.2, -30);
  scene.add(gridHelper);

  // Landmark Sign
  landmarkSign = createLandmarkSign(-64);
  scene.add(landmarkSign);
}

/* ---------- Input Listeners ---------- */
function onMouseMove(e) {
  camState.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  camState.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
}

function onScroll() {
  updateProgress();
  poseAtScroll();
}

function onResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  buildCamPoses();
  measureKeyframes();
  poseAtScroll();
}

/* ---------- Main Animation Loop ---------- */
function animate() {
  animationId = requestAnimationFrame(animate);

  if (!renderer || !scene || !camera || !glOn) return;

  const elapsed = clock ? clock.getElapsedTime() : 0;

  // Smooth mouse lerp
  camState.mouseSmooth.x += (camState.mouse.x - camState.mouseSmooth.x) * 0.05;
  camState.mouseSmooth.y += (camState.mouse.y - camState.mouseSmooth.y) * 0.05;

  // Camera lerp to target
  camState.pos.lerp(camState.targetPos, camState.lerpSpeed);
  camState.look.lerp(camState.targetLook, camState.lerpSpeed);

  // Parallax applied to camera
  const parallaxX = camState.mouseSmooth.x * (isMobile ? 0.2 : 0.45);
  const parallaxY = -camState.mouseSmooth.y * (isMobile ? 0.15 : 0.35);

  camera.position.set(
    camState.pos.x + parallaxX,
    camState.pos.y + parallaxY,
    camState.pos.z
  );

  camera.lookAt(
    camState.look.x + parallaxX * 0.5,
    camState.look.y + parallaxY * 0.5,
    camState.look.z
  );

  // Animate 3D deal meshes (gentle hovering & parallax response)
  dealMeshes.forEach((mesh) => {
    const { floatSpeed, floatOffset, baseRotY } = mesh.userData;
    mesh.position.y += Math.sin(elapsed * floatSpeed + floatOffset) * 0.0015;
    mesh.rotation.y = baseRotY + camState.mouseSmooth.x * 0.08;
    mesh.rotation.x = 0.04 - camState.mouseSmooth.y * 0.06;
  });

  // Slow particle drift
  if (ambientParticles) {
    ambientParticles.rotation.y = elapsed * 0.015;
  }

  renderer.render(scene, camera);
}

/* ---------- Initialization ---------- */
export function initScene3D() {
  if (inited) return;
  inited = true;

  canvas = document.getElementById('gl');
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.id = 'gl';
    document.body.prepend(canvas);
  }

  clock = new THREE.Clock();

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: !isMobile,
    powerPreference: 'high-performance',
    alpha: true,
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080808);
  scene.fog = new THREE.FogExp2(0x080808, 0.024);

  // Camera
  camera = new THREE.PerspectiveCamera(
    isMobile ? 54 : 42,
    window.innerWidth / window.innerHeight,
    0.1,
    200
  );
  camera.position.copy(camState.pos);

  // Build Environment
  setupEnvironment();

  // Setup Poses
  buildCamPoses();

  // Measure initial DOM layout
  setTimeout(() => {
    measureKeyframes();
    poseAtScroll();
  }, 100);

  // Events
  window.addEventListener('mousemove', onMouseMove, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Start loop
  animate();
}

/* ---------- Toggle 3D Mode ---------- */
export function toggle3DMode(forceState) {
  glOn = forceState !== undefined ? forceState : !glOn;
  document.documentElement.classList.toggle('gl-on', glOn);
  document.documentElement.classList.toggle('no-gl', !glOn);
  return glOn;
}

export function isWebGLEnabled() {
  return inited && glOn;
}

export function getScene() {
  return scene;
}

export function getCamera() {
  return camera;
}

export { THREE };

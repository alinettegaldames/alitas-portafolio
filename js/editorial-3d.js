import * as THREE from 'three';
import { OrbitControls } from './vendor/OrbitControls.js';

const section = document.querySelector('#editorial-3d');
const stage = section.querySelector('[data-editorial-stage]');
const container = section.querySelector('[data-editorial-canvas]');
const status = section.querySelector('[data-editorial-status]');
const toggle = section.querySelector('[data-editorial-toggle]');
const flat = section.querySelector('.editorial-object__flat');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pageCount = 15;
const pageWidth = 2.97;
const pageHeight = 2.1;
const thickness = 0.018;

function loadPage(number) {
  const src = `assets/editorial/pages/pagina-${String(number).padStart(2, '0')}.jpg`;
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar ${src}`));
    image.src = src;
  });
}

async function initialize() {
  const images = [];
  for (let first = 1; first <= pageCount; first += 4) {
    const count = Math.min(4, pageCount - first + 1);
    images.push(...await Promise.all(Array.from({ length: count }, (_, index) => loadPage(first + index))));
  }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.minDistance = 2;
  controls.maxDistance = 80;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9a997, 1.7));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  light.position.set(-3, 6, 8);
  light.castShadow = true;
  light.shadow.mapSize.set(1024, 1024);
  light.shadow.camera.left = -8;
  light.shadow.camera.right = 8;
  light.shadow.camera.top = 6;
  light.shadow.camera.bottom = -6;
  scene.add(light);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.ShadowMaterial({ opacity: 0.12 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -pageHeight / 2 - 0.2;
  floor.receiveShadow = true;
  scene.add(floor);

  const root = new THREE.Group();
  scene.add(root);
  const sheets = [];
  const meshes = [];
  const geometry = new THREE.BoxGeometry(pageWidth, pageHeight, thickness);
  const edge = new THREE.MeshStandardMaterial({ color: '#eeeae3', roughness: 1 });
  const blank = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const materials = images.map(image => {
    const texture = new THREE.Texture(image);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return new THREE.MeshBasicMaterial({ map: texture });
  });

  for (let index = 0; index < Math.ceil(pageCount / 2); index++) {
    const hinge = new THREE.Group();
    const sheet = new THREE.Mesh(geometry, [
      edge, edge, edge, edge,
      materials[index * 2],
      materials[index * 2 + 1] || blank,
    ]);
    sheet.position.x = pageWidth / 2;
    sheet.castShadow = true;
    sheet.receiveShadow = true;
    sheet.userData.sheetIndex = index;
    hinge.add(sheet);
    root.add(hinge);
    sheets.push(hinge);
    meshes.push(sheet);
  }

  let spread = 0;
  let target = 0;
  let startSpread = 0;
  let animationStart = 0;
  let duration = 0;
  let animating = false;
  let visible = false;
  let contextLost = false;
  let frame = 0;
  let pointerStart = null;
  let multiplePointers = false;
  const pointers = new Set();
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function setShape(value) {
    root.position.x = -pageWidth / 2 * (1 - Math.min(value, 1));
    sheets.forEach((hinge, index) => {
      const turn = THREE.MathUtils.clamp(value - index, 0, 1);
      hinge.rotation.y = Math.PI * turn;
      hinge.position.z = THREE.MathUtils.lerp(-index * thickness, (index - sheets.length) * thickness, turn);
    });
    root.updateMatrixWorld(true);
  }

  function frameObject() {
    const displayedWidth = pageWidth * (1 + Math.min(spread, 1));
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = Math.max(pageHeight / (2 * Math.tan(halfFov)), displayedWidth / (2 * Math.tan(halfFov) * camera.aspect)) * 1.35;
    controls.target.set(0, 0, 0);
    camera.position.set(0, distance * 0.08, distance);
    controls.update();
  }

  function renderOnce() {
    controls.update();
    renderer.render(scene, camera);
  }

  function resize() {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    frameObject();
    renderOnce();
  }

  function updateStatus() {
    const page = Math.round(target);
    status.textContent = page === 0 ? 'Portada · página 1 de 15' : `Páginas ${page * 2} y ${page * 2 + 1} de 15`;
    toggle.textContent = page ? 'Cerrar portafolio' : 'Abrir portafolio';
    toggle.setAttribute('aria-expanded', String(page > 0));
  }

  function goTo(next) {
    if (contextLost) return;
    next = THREE.MathUtils.clamp(next, 0, 7);
    if (next === target && !animating) return;
    startSpread = spread;
    target = next;
    animationStart = performance.now();
    duration = reducedMotion.matches ? 0 : Math.min(2600, 650 * Math.max(1, Math.abs(target - startSpread)));
    animating = true;
    updateStatus();
    resume();
  }

  function tick(time) {
    if (!visible || document.hidden || contextLost) {
      frame = 0;
      return;
    }
    if (animating) {
      const elapsed = duration ? Math.min((time - animationStart) / duration, 1) : 1;
      const ease = elapsed * elapsed * (3 - 2 * elapsed);
      spread = THREE.MathUtils.lerp(startSpread, target, ease);
      setShape(spread);
      if (startSpread < 1 || target === 0) frameObject();
      if (elapsed === 1) animating = false;
    }
    renderOnce();
    frame = requestAnimationFrame(tick);
  }

  function resume() {
    if (visible && !document.hidden && !contextLost && !frame) {
      if (animating) {
        startSpread = spread;
        animationStart = performance.now();
      }
      frame = requestAnimationFrame(tick);
    }
  }

  toggle.addEventListener('click', () => goTo(target ? 0 : 1));
  renderer.domElement.addEventListener('pointerdown', event => {
    pointers.add(event.pointerId);
    if (pointers.size > 1) multiplePointers = true;
    if (event.isPrimary) pointerStart = { x: event.clientX, y: event.clientY };
  });
  renderer.domElement.addEventListener('pointerup', event => {
    pointers.delete(event.pointerId);
    if (event.isPrimary && pointerStart && !multiplePointers && !animating &&
        Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) < 6) {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(meshes)[0];
      if (hit) goTo(target + (hit.object.userData.sheetIndex < target ? -1 : 1));
    }
    if (!pointers.size) {
      pointerStart = null;
      multiplePointers = false;
    }
  });
  renderer.domElement.addEventListener('pointercancel', event => {
    pointers.delete(event.pointerId);
    pointerStart = null;
    if (!pointers.size) multiplePointers = false;
  });
  stage.addEventListener('keydown', event => {
    if (contextLost) return;
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      if (!animating) goTo(target + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (['+', '=', '-', '_'].includes(event.key)) {
      event.preventDefault();
      const offset = camera.position.clone().sub(controls.target);
      const factor = event.key === '+' || event.key === '=' ? 0.8 : 1.25;
      offset.setLength(THREE.MathUtils.clamp(offset.length() * factor, controls.minDistance, controls.maxDistance));
      camera.position.copy(controls.target).add(offset);
      renderOnce();
    }
  });
  renderer.domElement.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    controls.enabled = false;
    status.textContent = 'Se perdió la conexión con la vista 3D. Puedes revisar las páginas en plano.';
    flat.open = true;
    toggle.disabled = true;
  });

  setShape(0);
  resize();
  new ResizeObserver(resize).observe(stage);
  new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    resume();
  }).observe(stage);
  document.addEventListener('visibilitychange', resume);
  toggle.disabled = false;
  updateStatus();
}

initialize().catch(error => {
  console.error('Error al iniciar el portafolio editorial 3D:', error);
  status.textContent = 'No se pudo cargar la vista 3D. Puedes revisar las páginas en plano.';
  flat.open = true;
});

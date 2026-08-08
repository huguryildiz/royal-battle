// js/village/scene.js — 3D köy: Retro Fantasy parçalarından kompoze binalar,
// Aslan'ın harita yerleşimi, tap → ekran, kamera pan.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

THREE.Cache.enabled = true; // dokular modeller arasında paylaşılıyor; tekrar indirme
const loader = new GLTFLoader();
const glbCache = new Map();
function loadGLB(name) {
  if (!glbCache.has(name)) {
    glbCache.set(name, new Promise((res, rej) =>
      loader.load(`assets/kenney/retro-fantasy/${name}.glb`, g => res(g.scene), undefined, rej)));
  }
  return glbCache.get(name).then(m => m.clone());
}

// Parçalar 1×1×1 grid karoları: [ad, x, y(kat), z] — grup içi yerel konum.
async function compose(parts, scale = 1) {
  const g = new THREE.Group();
  const meshes = await Promise.all(parts.map(p => loadGLB(p[0])));
  meshes.forEach((m, i) => { m.position.set(parts[i][1], parts[i][2], parts[i][3]); g.add(m); });
  g.scale.setScalar(scale);
  return g;
}

async function buildHouse(door = true) {
  const g = new THREE.Group();
  const [front, back, side1, side2, roof] = await Promise.all([
    loadGLB(door ? 'wall-pane-painted-wood-door' : 'wall-pane-painted-wood'),
    loadGLB('wall-pane-painted-wood-window'),
    loadGLB('wall-pane-painted-wood'), loadGLB('wall-pane-painted-wood'),
    loadGLB('roof'),
  ]);
  front.position.set(0, 0, 0.5);
  back.position.set(0, 0, -0.5); back.rotation.y = Math.PI;
  side1.position.set(-0.5, 0, 0); side1.rotation.y = Math.PI / 2;
  side2.position.set(0.5, 0, 0); side2.rotation.y = -Math.PI / 2;
  roof.position.set(0, 1, 0);
  g.add(front, back, side1, side2, roof);
  g.scale.setScalar(2);
  return g;
}

async function buildCastle() {
  const g = new THREE.Group();
  const towerAt = async (x, z) => {
    const t = await compose([['tower-base', 0, 0, 0], ['tower', 0, 1, 0], ['tower-top', 0, 2, 0]]);
    t.position.set(x, 0, z); g.add(t);
  };
  const wallAt = async (name, x, z, rotY = 0) => {
    const w = await loadGLB(name);
    w.position.set(x, 0, z); w.rotation.y = rotY; g.add(w);
  };
  await Promise.all([
    towerAt(-2, -1.5), towerAt(2, -1.5), towerAt(-2, 1.5), towerAt(2, 1.5),
    wallAt('wall-fortified', -1, 1.5), wallAt('wall-fortified-gate', 0, 1.5), wallAt('wall-fortified', 1, 1.5),
    wallAt('wall-fortified', -1, -1.5), wallAt('wall-fortified', 0, -1.5), wallAt('wall-fortified', 1, -1.5),
    wallAt('wall-fortified', -2, -0.5, Math.PI / 2), wallAt('wall-fortified', -2, 0.5, Math.PI / 2),
    wallAt('wall-fortified', 2, -0.5, Math.PI / 2), wallAt('wall-fortified', 2, 0.5, Math.PI / 2),
  ]);
  g.scale.setScalar(1.7);
  return g;
}

async function buildBarracks() {
  const g = await compose([
    ['wall-fortified', -0.5, 0, 0], ['wall-fortified-gate', 0.5, 0, 0],
    ['battlement', -0.5, 1, 0], ['battlement', 0.5, 1, 0],
  ], 1.8);
  return g;
}

async function buildGate() {
  const g = await compose([
    ['tower-base', -1, 0, 0], ['tower-base', 1, 0, 0],
    ['tower', -1, 1, 0], ['tower', 1, 1, 0],
    ['tower-top', -1, 2, 0], ['tower-top', 1, 2, 0],
    ['wall-fortified-gate', 0, 0, 0], ['battlement', 0, 1, 0],
  ], 1.6);
  return g;
}

async function buildTree(scale = 2) {
  const t = await loadGLB('tree-large');
  t.scale.setScalar(scale);
  return t;
}

async function buildWoodcamp() {
  const g = new THREE.Group();
  const [t1, t2, barrels, crate] = await Promise.all([
    buildTree(2.2), buildTree(1.8), loadGLB('barrels'), loadGLB('detail-crate')]);
  t1.position.set(-1.5, 0, -1); t2.position.set(1.5, 0, -1.5);
  barrels.scale.setScalar(2); barrels.position.set(0.5, 0, 1);
  crate.scale.setScalar(2); crate.position.set(-1, 0, 1.2);
  g.add(t1, t2, barrels, crate);
  return g;
}

async function buildMarket() {
  const g = new THREE.Group();
  const [h1, h2, h3] = await Promise.all([buildHouse(true), buildHouse(false), buildHouse(true)]);
  h1.position.set(-2.5, 0, 0); h2.position.set(0.3, 0, 1.5); h2.rotation.y = 0.3; h3.position.set(2.8, 0, 0);
  g.add(h1, h2, h3);
  return g;
}

// YERLEŞİM (Aslan'ın haritası): kale merkez, evler sol, iş alanı sağ üst,
// market sağ alt, asker alma orta alt, savaş kapısı sağ kenar, ağaçlar sol üst.
export async function initVillage({ canvas, onBuildingTap }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9bcfe0);
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
  camera.position.set(0, 22, 18); camera.lookAt(0, 0, 0);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(10, 20, 8); scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshLambertMaterial({ color: 0x74b35c }));
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  addEventListener('resize', resize);
  resize();
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  // [builder, x, z, döndürY, tapHedefi|null] — yükleme ilerledikçe sahneye girer.
  const placements = [
    [buildCastle, 0, -4, 0, null],
    [() => buildHouse(true), -10, -4, 0.4, null],
    [() => buildHouse(false), -13, 0, 0, null],
    [() => buildHouse(true), -9, 2, -0.3, null],
    [() => buildTree(2.4), -13, -9, 0, null],
    [() => buildTree(2), -10, -10, 0, null],
    [() => buildTree(1.8), -15, -6, 0, null],
    [buildWoodcamp, 10, -7, 0, 'is'],
    [buildMarket, 10, 6, Math.PI, 'envanter'],
    [buildBarracks, 0, 7, 0, 'asker'],
    [buildGate, 16, 0, -Math.PI / 2, 'savas'],
  ];
  for (const [builder, x, z, rotY, tap] of placements) {
    builder().then(obj => {
      obj.position.set(x, 0, z); obj.rotation.y = rotY;
      if (tap) obj.userData.tap = tap;
      scene.add(obj);
    }).catch(e => console.error('bina yüklenemedi:', e));
  }

  // Tap (raycast) + kamera pan — pointerdown/up arası < 8px kayma ise tap say.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let downX = 0, downY = 0, panning = false, lastX = 0, lastY = 0;
  canvas.addEventListener('pointerdown', e => {
    downX = lastX = e.clientX; downY = lastY = e.clientY; panning = true;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!panning) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    camera.position.x = THREE.MathUtils.clamp(camera.position.x - dx * 0.03, -12, 12);
    camera.position.z = THREE.MathUtils.clamp(camera.position.z - dy * 0.03, 8, 26);
  });
  canvas.addEventListener('pointerup', e => {
    panning = false;
    if (Math.hypot(e.clientX - downX, e.clientY - downY) >= 8) return;
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    for (const hit of raycaster.intersectObjects(scene.children, true)) {
      let o = hit.object;
      while (o) {
        if (o.userData.tap) { onBuildingTap(o.userData.tap); return; }
        o = o.parent;
      }
    }
  });

  return { resize };
}

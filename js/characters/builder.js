// js/characters/builder.js — Aslan'ın çizimlerine göre 3D karakter giydirme.
// İnsansılar: Kenney Blocky iskeleti (yüz dokusu korunur) + renk + aksesuar.
// Kutu-inşa: buz ejderhası, maden dinozoru, altın bomba çiçeği.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
let basePromise = null;
function loadBase() {
  basePromise ??= new Promise((res, rej) =>
    loader.load('assets/kenney/blocky-characters/character-a.glb', g => res(g.scene), undefined, rej));
  return basePromise;
}

const mat = (color, opts = {}) => new THREE.MeshLambertMaterial({ color, ...opts });
const box = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  return b;
};

// Blocky GLB açılamazsa aynı görünüm dilinde kutu-inşa insansı.
function kutuInsansi({ govde, kol, bacak, kafaRenk }) {
  const g = new THREE.Group();
  g.add(box(0.55, 0.7, 0.32, mat(govde), 0, 0.95, 0));
  g.add(box(0.42, 0.4, 0.34, mat(kafaRenk ?? 0xe8c39e), 0, 1.5, 0));
  for (const x of [-0.36, 0.36]) g.add(box(0.14, 0.6, 0.2, mat(kol ?? govde), x, 0.95, 0));
  for (const x of [-0.14, 0.14]) g.add(box(0.18, 0.6, 0.24, mat(bacak ?? govde), x, 0.3, 0));
  const base = new THREE.Group();
  base.add(...g.children.slice());
  return base;
}

// Blocky iskeleti: parçaları boya (kafa dokusu = yüz, korunur), 1.8 birime ölçekle.
async function humanoid({ govde, kol, bacak, kafaRenk = null, opacity = null }) {
  let base;
  try {
    base = (await loadBase()).clone();
  } catch {
    const g = new THREE.Group();
    g.add(kutuInsansi({ govde, kol, bacak, kafaRenk }));
    return g;
  }
  base.traverse(o => {
    if (!o.isMesh) return;
    if (o.name === 'torso') o.material = mat(govde);
    else if (o.name.startsWith('arm')) o.material = mat(kol ?? govde);
    else if (o.name.startsWith('leg')) o.material = mat(bacak ?? govde);
    else if (o.name === 'head') {
      o.material = kafaRenk ? mat(kafaRenk) : o.material.clone();
    }
    if (opacity != null) { o.material.transparent = true; o.material.opacity = opacity; }
  });
  const g = new THREE.Group();
  g.add(base);
  // 1.8 birim boy, ayaklar y=0
  const kutu = new THREE.Box3().setFromObject(base);
  const olcek = 1.8 / (kutu.max.y - kutu.min.y);
  base.scale.setScalar(olcek);
  base.position.y = -kutu.min.y * olcek;
  g.updateMatrixWorld(true); // parcaKutu ölçek SONRASI doğru kutu versin
  return g;
}

// Parça bbox'ı (grup uzayında) — aksesuar konumlamak için.
function parcaKutu(g, ad) {
  const p = g.getObjectByName(ad);
  return p ? new THREE.Box3().setFromObject(p) : null;
}

function balta(sapRenk = 0x7c4e28) {
  const g = new THREE.Group();
  const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.5), mat(sapRenk));
  const bas = box(0.22, 0.16, 0.05, mat(0xaeb6bd), 0.1, 0.2, 0);
  g.add(sap, bas);
  return g;
}
function kilic() {
  const g = new THREE.Group();
  const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.14), mat(0x5a4a38));
  const siper = box(0.14, 0.03, 0.05, mat(0xb9821e), 0, 0.08, 0);
  const namlu = box(0.06, 0.42, 0.02, mat(0xd7dce1), 0, 0.3, 0);
  g.add(sap, siper, namlu);
  return g;
}
function yay() {
  const g = new THREE.Group();
  const kavis = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.025, 6, 12, Math.PI), mat(0x7c4e28));
  kavis.rotation.z = -Math.PI / 2;
  const kiris = box(0.012, 0.56, 0.012, mat(0xf5ebd3));
  g.add(kavis, kiris);
  return g;
}
function disSirasi(n, aralik, boyut, y, z, renk = 0xffffff) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const d = new THREE.Mesh(new THREE.ConeGeometry(boyut, boyut * 1.6, 4), mat(renk));
    d.position.set((i - (n - 1) / 2) * aralik, y, z);
    d.rotation.x = Math.PI;
    g.add(d);
  }
  return g;
}

const BUILDERS = {
  // kahve saç, kırmızı-bordo gövde, sol el balta, sağ el kılıç
  async savasci() {
    const g = await humanoid({ govde: 0x8a3b2e, kol: 0x8a3b2e, bacak: 0x4a3626 });
    const kafa = parcaKutu(g, 'head');
    if (kafa) {
      const sac = box((kafa.max.x - kafa.min.x) * 1.05, 0.1, (kafa.max.z - kafa.min.z) * 1.05,
        mat(0x5a3a1e), (kafa.min.x + kafa.max.x) / 2, kafa.max.y + 0.04, (kafa.min.z + kafa.max.z) / 2);
      g.add(sac);
    }
    const b = balta(); b.position.set(-0.7, 0.95, 0.3); b.rotation.z = 0.25; g.add(b);
    const k = kilic(); k.position.set(0.7, 1.0, 0.3); k.rotation.z = -0.2; g.add(k);
    return g;
  },
  // yeşil kapüşon, elinde yay
  async okcu() {
    const g = await humanoid({ govde: 0x3e7c4f, kol: 0x3e7c4f, bacak: 0x2f4a33 });
    const kafa = parcaKutu(g, 'head');
    if (kafa) {
      const kap = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x2f6a41));
      kap.position.set((kafa.min.x + kafa.max.x) / 2, kafa.max.y - 0.02, (kafa.min.z + kafa.max.z) / 2);
      g.add(kap);
    }
    const y = yay(); y.position.set(0.7, 1.0, 0.35); g.add(y);
    return g;
  },
  // mor cübbe (geniş gövde), ellerde sarı kıvılcımlar
  async buyucu() {
    const g = await humanoid({ govde: 0x6b3fa0, kol: 0x6b3fa0, bacak: 0x4a2c73 });
    const torso = g.getObjectByName('torso');
    if (torso) torso.scale.set(1.25, 1.1, 1.25);
    for (const x of [-0.55, 0.55]) {
      const kivilcim = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(0xffd94a, { emissive: 0xcc9900 }));
      kivilcim.position.set(x * 1.2, 0.95, 0.25);
      g.add(kivilcim);
    }
    return g;
  },
  // tamamen altın, başta minik bayrak
  async 'altin-ordu'() {
    const g = await humanoid({ govde: 0xe9b33c, kol: 0xe9b33c, bacak: 0xb9821e, kafaRenk: 0xe9b33c });
    const kafa = parcaKutu(g, 'head');
    const y0 = kafa ? kafa.max.y : 1.7;
    const direk = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.3), mat(0x7c4e28));
    direk.position.set(0, y0 + 0.15, 0);
    const bayrak = box(0.16, 0.1, 0.01, mat(0xd96c4f), 0.09, y0 + 0.24, 0);
    g.add(direk, bayrak);
    return g;
  },
  // koyu mor, yarı saydam, ayak altında halka
  async 'kara-ruh'() {
    const g = await humanoid({ govde: 0x3a2a5e, kol: 0x453370, bacak: 0x2c1f47, kafaRenk: 0x453370, opacity: 0.55 });
    const halka = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.55, 24), mat(0x6b5ae0, { transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
    halka.rotation.x = -Math.PI / 2;
    halka.position.y = 0.02;
    g.add(halka);
    return g;
  },
  // açık mavi: gövde + uzun boyun (3 kutu) + kanatlar + diş sırası
  async 'buz-ejderhasi'() {
    const g = new THREE.Group();
    const buz = mat(0x9bd7e8), koyu = mat(0x6fb8d4);
    g.add(box(1.0, 0.55, 0.6, buz, 0, 0.5, 0));                    // gövde
    g.add(box(0.28, 0.35, 0.28, buz, 0.45, 0.9, 0));               // boyun 1
    g.add(box(0.24, 0.35, 0.24, buz, 0.55, 1.2, 0));               // boyun 2
    g.add(box(0.34, 0.3, 0.3, koyu, 0.62, 1.5, 0.02));             // kafa
    const dis = disSirasi(4, 0.07, 0.03, -0.16, 0.14); dis.position.set(0.62, 1.5, 0.02); g.add(dis);
    for (const [z, don] of [[0.42, 0.5], [-0.42, -0.5]]) {          // kanatlar
      const kanat = box(0.7, 0.5, 0.06, koyu, -0.15, 0.95, z);
      kanat.rotation.x = don;
      g.add(kanat);
    }
    g.add(box(0.5, 0.18, 0.18, buz, -0.65, 0.45, 0));              // kuyruk
    for (const x of [-0.3, 0.3]) for (const z of [-0.2, 0.2]) g.add(box(0.16, 0.25, 0.16, koyu, x, 0.12, z));
    return g;
  },
  // gri-yeşil iri gövde + kısa bacaklar + sırtında madenci + kazma
  async 'maden-dinozoru'() {
    const g = new THREE.Group();
    const govde = mat(0x6e7d5a), koyu = mat(0x556247);
    g.add(box(1.2, 0.7, 0.7, govde, 0, 0.65, 0));                  // iri gövde
    g.add(box(0.4, 0.35, 0.4, koyu, 0.7, 0.95, 0));                // kafa
    const dis = disSirasi(3, 0.09, 0.03, -0.2, 0.18); dis.position.set(0.7, 0.95, 0); g.add(dis);
    g.add(box(0.5, 0.2, 0.2, govde, -0.75, 0.55, 0));              // kuyruk
    for (const x of [-0.4, 0.4]) for (const z of [-0.22, 0.22]) g.add(box(0.2, 0.3, 0.2, koyu, x, 0.15, z));
    // sırttaki minik madenci
    const adam = new THREE.Group();
    adam.add(box(0.16, 0.2, 0.1, mat(0x8a3b2e), 0, 0.1, 0));       // gövde
    adam.add(box(0.12, 0.12, 0.1, mat(0xe8c39e), 0, 0.28, 0));     // kafa
    const kazma = new THREE.Group();
    const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3), mat(0x7c4e28));
    kazma.add(sap, box(0.18, 0.04, 0.04, mat(0xaeb6bd), 0, 0.14, 0));
    kazma.position.set(0.14, 0.15, 0); kazma.rotation.z = -0.5;
    adam.add(kazma);
    adam.position.set(-0.1, 1.0, 0);
    g.add(adam);
    return g;
  },
  // yeşil sap + altın çanak + içinde diş sırası
  async 'altin-bomba-cicegi'() {
    const g = new THREE.Group();
    const sap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.0), mat(0x3e7c4f));
    sap.position.y = 0.5;
    const canak = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xe9b33c));
    canak.rotation.x = Math.PI; canak.position.y = 1.35;
    const govde = new THREE.Mesh(new THREE.SphereGeometry(0.34, 12, 8), mat(0xffd94a));
    govde.position.y = 1.3;
    const dis = disSirasi(5, 0.13, 0.045, 0.12, 0.3);
    dis.position.y = 1.35;
    for (const [x, y] of [[-0.18, 0.68], [0.18, 0.82]]) {          // yapraklar
      const yaprak = box(0.3, 0.08, 0.16, mat(0x74b35c), x, y, 0);
      yaprak.rotation.z = x > 0 ? 0.4 : -0.4;
      g.add(yaprak);
    }
    g.add(sap, canak, govde, dis);
    return g;
  },
  // düşman askeri: gri insansı
  async dusman() {
    return humanoid({ govde: 0x5a5f66, kol: 0x5a5f66, bacak: 0x3a3e44 });
  },
};

const HEDEF_BOY = 2; // ≤ 2 birim
export async function buildCharacter(id) {
  const g = await (BUILDERS[id] ?? BUILDERS.dusman)();
  const kutu = new THREE.Box3().setFromObject(g);
  const boy = kutu.max.y - kutu.min.y;
  if (boy > HEDEF_BOY) g.scale.setScalar(HEDEF_BOY / boy);
  return g;
}

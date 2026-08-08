// js/main.js
import * as THREE from 'three';
import { initTabs, show, register } from './screens.js';
import { load } from './state.js';
import { initHud } from './ui/hud.js';

export const gameState = load();
initTabs();
initHud(gameState);
const canvas = document.getElementById('village-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bcfe0);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 200);
camera.position.set(0, 22, 18); camera.lookAt(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 1.2); sun.position.set(10, 20, 8); scene.add(sun);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshLambertMaterial({ color: 0x74b35c }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
register('s-koy', { onShow: resize });
show('s-koy');
renderer.setAnimationLoop(() => renderer.render(scene, camera));

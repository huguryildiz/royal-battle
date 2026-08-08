// js/screens.js — ekran yöneticisi. Ekranlar kayıt olur, show() geçiş yapar.
const registry = new Map();
export function register(id, handlers = {}) { registry.set(id, handlers); }
export function show(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('active', b.dataset.s === id));
  registry.get(id)?.onShow?.();
}
export function initTabs() {
  document.querySelectorAll('#tabs button').forEach(b =>
    b.addEventListener('click', () => show(b.dataset.s)));
}

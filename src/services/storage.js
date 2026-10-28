import { initialState, normalizeState } from '../domain/lottery.js';
// Keep the original key so users retain history when served from the same origin.
export const STORE_KEY = 'lotto-random-v1';
export function loadState() {
  try { return normalizeState(JSON.parse(localStorage.getItem(STORE_KEY))); }
  catch { return initialState(); }
}
export function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}

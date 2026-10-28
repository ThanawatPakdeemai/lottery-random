import { Digit } from '../atoms/Digit.js';
export function NumberDisplay(value, n, settled) {
  const element = document.createElement('div');
  element.className = 'grid gap-2 py-5 sm:gap-3';
  element.style.gridTemplateColumns = `repeat(${n}, minmax(0, 1fr))`;
  element.setAttribute('aria-hidden', 'true');
  Array.from({ length: n }, (_, i) => element.append(Digit(value?.[i] ?? '–', settled)));
  return element;
}

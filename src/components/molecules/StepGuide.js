import { MODES } from '../../domain/lottery.js';
export function StepGuide(step) {
  const list = document.createElement('ol');
  list.className = 'grid grid-cols-3 gap-2';
  list.setAttribute('aria-label', 'ลำดับการสุ่ม');
  MODES.forEach((mode, index) => {
    const item = document.createElement('li');
    item.className = `rounded-xl border bg-panel px-3 py-2 text-xs ${index === step ? 'border-accent ring-1 ring-accent text-ink' : 'border-line text-muted'}`;
    if (index === step) item.setAttribute('aria-current', 'step');
    item.innerHTML = `<b class="block text-sm">ครั้งที่ ${index + 1} · ${mode.n} ตัว</b><span class="font-mono">${mode.range}</span>`;
    list.append(item);
  });
  return list;
}

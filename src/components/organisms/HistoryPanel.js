import { Button } from '../atoms/Button.js';
import { HistoryRow } from '../molecules/HistoryRow.js';
export function HistoryPanel(history, busy, onClear, onShare) {
  const section = document.createElement('section');
  section.className = 'overflow-hidden rounded-2xl border border-line bg-panel';
  section.setAttribute('aria-label', 'ประวัติการสุ่ม');
  const heading = document.createElement('div');
  heading.className = 'flex items-center justify-between gap-2 p-4';
  heading.innerHTML = '<h2 class="font-semibold">ประวัติการสุ่ม</h2>';
  heading.append(Button('ล้างประวัติ', onClear, { disabled: busy || !history.length }));
  const list = document.createElement('ol');
  list.id = 'history-list';
  history.forEach(entry => list.append(HistoryRow(entry, onShare, busy)));
  if (!history.length) list.innerHTML = '<li class="border-t border-line p-5 text-center text-sm text-muted">ยังไม่มีผล กดปุ่มสุ่มเพื่อเริ่ม</li>';
  section.append(heading, list);
  return section;
}

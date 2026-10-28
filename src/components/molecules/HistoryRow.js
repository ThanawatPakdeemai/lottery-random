import { fmtWhen } from '../../domain/lottery.js';
import { Button } from '../atoms/Button.js';
export function HistoryRow(entry, onShare, busy) {
  const when = fmtWhen(entry);
  const button = Button('', () => onShare(entry), { disabled: busy,
    className: 'flex w-full flex-wrap items-center justify-between gap-2 rounded-none border-0 border-t border-line px-4 py-3 text-left' });
  button.setAttribute('aria-label', `ดูรูปผลการสุ่ม ${entry.value}`);
  const label = document.createElement('span');
  label.className = 'text-xs text-muted';
  label.textContent = `ครั้งที่ ${entry.idx} · ${entry.n} ตัว`;
  const number = document.createElement('span');
  number.className = 'font-mono text-lg font-medium tracking-widest text-accent';
  number.textContent = entry.value;
  const time = document.createElement('span');
  time.className = 'text-right text-xs text-muted';
  time.textContent = `${when.date} ${when.time}`;
  button.append(label, number, time);
  const item = document.createElement('li');
  item.append(button);
  return item;
}

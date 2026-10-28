import { MODES } from '../../domain/lottery.js';
import { Button } from '../atoms/Button.js';
import { NumberDisplay } from '../molecules/NumberDisplay.js';
export function LotteryTicket(state, busy, actions) {
  const section = document.createElement('section');
  section.className = 'overflow-hidden rounded-2xl border border-line bg-panel';
  section.setAttribute('aria-label', 'ผลการสุ่ม');
  section.setAttribute('aria-busy', String(busy));
  const mode = !busy && state.lastValue ? MODES.find(m => m.n === state.lastValue.length) : MODES[state.step];
  const result = document.createElement('div');
  result.className = 'px-4 pt-5 sm:px-6';
  result.innerHTML = `<div class="flex flex-wrap justify-between gap-2 text-sm text-muted"><strong>${busy ? 'กำลังสุ่ม · ' + mode.label : state.lastValue ? 'ผลล่าสุด · ' + mode.label : 'พร้อมสุ่ม'}</strong><span class="font-mono">${mode.range}</span></div>`;
  const display = NumberDisplay(state.lastValue, mode.n, !!state.lastValue);
  display.id = 'number-display';
  const output = document.createElement('output');
  output.id = 'result-output';
  output.className = 'sr-only';
  output.setAttribute('aria-live', 'polite');
  output.textContent = state.lastValue || 'ยังไม่ได้สุ่ม';
  result.append(display, output);
  const stub = document.createElement('div');
  stub.className = 'space-y-3 border-t-2 border-dashed border-line p-4 sm:p-6';
  const go = Button(`กดสุ่มครั้งที่ ${state.step + 1} · ${MODES[state.step].label}`, actions.draw, { primary: true, disabled: busy, className: 'w-full py-4 text-lg' });
  go.id = 'draw-button';
  const note = document.createElement('p');
  note.className = 'text-center text-xs text-muted';
  note.textContent = 'สุ่มเพื่อความบันเทิง ผลไม่เกี่ยวกับสลากจริง';
  const buttons = document.createElement('div');
  buttons.className = 'flex flex-wrap justify-center gap-2';
  buttons.append(
    Button('ย้อนกลับ', actions.back, { disabled: busy || (!state.step && !state.rounds) }),
    Button('รีเซ็ต', actions.reset, { disabled: busy || (!state.step && !state.lastValue && !state.rounds) }),
    Button('คัดลอกเลข', actions.copy, { disabled: busy || !state.lastValue }),
    Button('แชร์ผลการสุ่ม', actions.share, { disabled: busy || !state.lastValue }),
  );
  stub.append(go, note, buttons);
  section.append(result, stub);
  return section;
}

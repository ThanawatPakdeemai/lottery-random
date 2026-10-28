import { MODES, randomDigit, randomValue, completeDraw, back, reset } from '../domain/lottery.js';
import { loadState, saveState } from '../services/storage.js';
import { Toast } from '../components/atoms/Toast.js';
import { NumberDisplay } from '../components/molecules/NumberDisplay.js';
import { StepGuide } from '../components/molecules/StepGuide.js';
import { LotteryTicket } from '../components/organisms/LotteryTicket.js';
import { HistoryPanel } from '../components/organisms/HistoryPanel.js';
import { ShareDialog } from '../components/organisms/ShareDialog.js';
import { PwaStatus } from '../components/organisms/PwaStatus.js';
import { AppLayout } from '../components/templates/AppLayout.js';
import { registerPwa } from '../pwa/register.js';

export function LotteryPage(root) {
  let state = loadState(), busy = false;
  const toast = Toast();
  const share = ShareDialog(message => toast.show(message));
  const pwa = PwaStatus();
  let storageWarning = false;
  function persist() {
    if (!saveState(state) && !storageWarning) {
      storageWarning = true;
      toast.show('บันทึกประวัติในเครื่องไม่ได้ ประวัติจะอยู่เฉพาะระหว่างเปิดแอป');
    }
  }
  function commit(next, message) {
    state = next; persist(); render();
    if (message) toast.show(message);
  }
  function openShare(entry) { if (!busy) share.open(entry); }
  async function copyValue() {
    try { await navigator.clipboard.writeText(state.lastValue); toast.show(`คัดลอก ${state.lastValue} แล้ว`); }
    catch { toast.show(`คัดลอกไม่ได้ เลขที่สุ่มได้คือ ${state.lastValue}`); }
  }
  async function draw() {
    if (busy) return;
    const value = randomValue(MODES[state.step].n);
    const idx = state.step;
    busy = true;
    render();
    const display = document.getElementById('number-display');
    display.style.gridTemplateColumns = `repeat(${value.length}, minmax(0, 1fr))`;
    display.replaceChildren(...NumberDisplay('', value.length, false).children);
    document.getElementById('result-output').textContent = 'กำลังสุ่ม…';
    document.getElementById('draw-button').textContent = `กำลังสุ่ม${MODES[idx].label}…`;
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const start = performance.now();
      await new Promise(resolve => {
        const timer = setInterval(() => {
          let done = true;
          [...display.children].forEach((cell, i) => {
            if (performance.now() - start < 600 + i * 170) {
              cell.textContent = randomDigit(); done = false;
            } else { cell.textContent = value[i]; }
          });
          if (done) { clearInterval(timer); resolve(); }
        }, 55);
      });
    }
    state = completeDraw(state, value);
    persist(); busy = false; render();
    document.getElementById('draw-button').focus({ preventScroll: true });
  }
  function render() {
    pwa.setBusy(busy);
    root.replaceChildren(AppLayout({
      pwa: pwa.element,
      steps: StepGuide(state.step),
      ticket: LotteryTicket(state, busy, {
        draw, copy: copyValue,
        back: () => commit(back(state), 'ย้อนกลับแล้ว'),
        reset: () => commit(reset(state), 'รีเซ็ตแล้ว เริ่มสุ่มครั้งที่ 1 ใหม่'),
        share: () => openShare({ value: state.lastValue, ts: state.lastTs, time: '' }),
      }),
      history: HistoryPanel(state.history, busy,
        () => commit({ ...state, history: [] }, 'ล้างประวัติแล้ว'), openShare),
    }));
  }
  document.body.append(share.element, toast.element);
  render();
  registerPwa(pwa);
}

import { Button } from '../atoms/Button.js';
export function PwaStatus() {
  const element = document.createElement('aside');
  element.className = 'rounded-xl border border-line bg-panel p-3 text-sm';
  element.setAttribute('aria-label', 'สถานะแอป');
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  const actions = document.createElement('div');
  actions.className = 'mt-2 flex flex-wrap gap-2';
  const update = Button('อัปเดตแอป', null);
  const install = Button('ติดตั้งแอป', null);
  const help = document.createElement('details');
  help.className = 'mt-2 text-xs text-muted';
  help.innerHTML = '<summary class="cursor-pointer">วิธีติดตั้งและใช้งานออฟไลน์</summary><p class="mt-2 leading-6">เปิดเว็บด้วยอินเทอร์เน็ตครั้งแรกจนขึ้น “พร้อมใช้งานออฟไลน์” จากนั้นเปิดและสุ่มเลขได้แม้ไม่มีเน็ต บน Android/คอมพิวเตอร์ เลือกติดตั้งจากเมนูเบราว์เซอร์ บน iPhone/iPad เปิดด้วย Safari → แชร์ → เพิ่มไปยังหน้าจอโฮม ประวัติอยู่ในเบราว์เซอร์นี้และอาจหายเมื่อล้างข้อมูลเว็บไซต์</p>';
  actions.append(install, update);
  element.append(status, actions, help);
  let ready = false, registrationError = false, waiting = false, busy = false, installed = false;
  let deferredPrompt, applyUpdate;
  const standalone = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  installed = !!standalone;
  function render() {
    const network = navigator.onLine ? 'ออนไลน์' : 'ออฟไลน์';
    status.textContent = import.meta.env.DEV ? `${network} · โหมดพัฒนา (ทดสอบออฟไลน์ด้วย npm run build และ npm run preview)` : registrationError ? `${network} · เตรียมออฟไลน์ไม่สำเร็จ กรุณาเปิดใหม่ขณะมีอินเทอร์เน็ต`
      : waiting ? `${network} · มีเวอร์ชันใหม่พร้อมอัปเดต`
      : ready ? `${network} · พร้อมใช้งานออฟไลน์`
      : `${network} · ${navigator.onLine ? 'กำลังเตรียมใช้งานออฟไลน์…' : 'ยังไม่พร้อมออฟไลน์ กรุณาเชื่อมต่ออินเทอร์เน็ตครั้งแรก'}`;
    update.hidden = !waiting;
    update.disabled = busy;
    install.hidden = !deferredPrompt || installed;
    actions.hidden = update.hidden && install.hidden;
  }
  update.addEventListener('click', () => { if (!busy) applyUpdate?.(true); });
  install.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    const prompt = deferredPrompt;
    deferredPrompt = null;
    try { await prompt.prompt(); await prompt.userChoice; }
    finally { render(); }
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredPrompt = event; render();
  });
  window.addEventListener('appinstalled', () => { installed = true; deferredPrompt = null; render(); });
  window.addEventListener('online', render);
  window.addEventListener('offline', render);
  render();
  return { element,
    setBusy(value) { busy = value; render(); },
    offlineReady() { ready = true; render(); },
    needRefresh() { waiting = true; render(); },
    error() { registrationError = true; render(); },
    setUpdater(fn) { applyUpdate = fn; },
  };
}

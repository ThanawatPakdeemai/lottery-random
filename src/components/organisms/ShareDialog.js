import { Button } from '../atoms/Button.js';
import { loadFonts, renderCard } from '../../services/share-card.js';
import { fmtWhen } from '../../domain/lottery.js';

export function ShareDialog(notify) {
  const element = document.createElement('dialog');
  element.className = 'fixed inset-0 m-auto max-h-[90dvh] w-[min(42rem,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-line bg-panel p-4 text-ink shadow-2xl sm:p-6';
  element.setAttribute('aria-labelledby', 'share-title');
  const header = document.createElement('div');
  header.className = 'mb-4 flex items-center justify-between gap-3';
  header.innerHTML = '<h2 id="share-title" class="text-lg font-semibold">รูปผลการสุ่ม</h2>';
  header.append(Button('ปิด', () => element.close()));
  const image = document.createElement('img');
  image.width = 1080; image.height = 720;
  image.alt = 'รูปผลการสุ่มหวย';
  image.className = 'w-full rounded-xl';
  const themes = document.createElement('div');
  themes.className = 'my-4 flex flex-wrap items-center gap-2';
  themes.setAttribute('role', 'group');
  themes.setAttribute('aria-label', 'เลือกธีม');
  themes.innerHTML = '<span class="mr-2 text-sm">ธีมรูปแชร์</span>';
  const info = document.createElement('p');
  info.className = 'my-3 text-sm text-muted';
  const actions = document.createElement('div');
  actions.className = 'flex flex-wrap gap-2';
  const download = document.createElement('a');
  download.className = 'btn-primary text-sm';
  download.textContent = 'บันทึกรูป';
  const copy = Button('คัดลอกรูป', async () => {
    try {
      if (!blob || !navigator.clipboard?.write || !window.ClipboardItem) throw new Error();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      notify('คัดลอกรูปแล้ว');
    } catch { notify('คัดลอกรูปไม่ได้ ให้กดบันทึกรูปแทน'); }
  });
  const native = Button('แชร์ไปแอปอื่น', async () => {
    try { await navigator.share({ files: [file], title: 'เครื่องสุ่มหวย' }); }
    catch (error) { if (error.name !== 'AbortError') notify('แชร์ไม่ได้ ให้กดบันทึกรูปแทน'); }
  });
  native.hidden = true;
  actions.append(download, copy, native);
  element.append(header, image, themes, info, actions);
  let entry, theme = 0, blob, file, objectUrl, generation = 0;
  const themeButtons = Array.from({ length: 5 }, (_, index) => {
    const button = Button(String(index + 1), () => { if (theme !== index) { theme = index; paint(); } });
    button.setAttribute('aria-label', `ธีม ${index + 1}`);
    themes.append(button);
    return button;
  });
  async function paint() {
    const current = ++generation;
    copy.disabled = true;
    native.hidden = true;
    download.hidden = true;
    themeButtons.forEach((button, index) => {
      button.setAttribute('aria-pressed', String(index === theme));
      button.classList.toggle('bg-accent', index === theme);
      button.classList.toggle('text-accent-ink', index === theme);
    });
    try {
      await loadFonts();
      const canvas = renderCard(entry.value, entry.ts, entry.time, theme);
      const result = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      canvas.width = canvas.height = 0; // Release the large canvas after encoding.
      if (current !== generation || !element.open) return;
      if (!result) throw new Error('Image generation failed');
      blob = result;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      objectUrl = URL.createObjectURL(blob);
      image.src = objectUrl;
      download.href = objectUrl;
      download.download = `lotto-${entry.value}.png`;
      download.hidden = false;
      copy.disabled = false;
      file = new File([blob], download.download, { type: 'image/png' });
      native.hidden = !(navigator.share && navigator.canShare?.({ files: [file] }));
    } catch (error) { console.error('Unable to generate share image', error); notify('สร้างรูปไม่สำเร็จ กรุณาลองใหม่'); }
  }
  element.addEventListener('click', event => { if (event.target === element) element.close(); });
  element.addEventListener('close', () => {
    generation++;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null; blob = null; file = null;
    image.removeAttribute('src');
  });
  return { element, open(result) {
    entry = result; theme = 0;
    const when = fmtWhen(entry);
    info.textContent = `เลข ${entry.value.length} ตัว · ${when.date} ${when.time}`;
    element.showModal();
    paint();
  } };
}

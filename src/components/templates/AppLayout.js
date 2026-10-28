export function AppLayout({ pwa, steps, ticket, history }) {
  const main = document.createElement('main');
  main.className = 'mx-auto grid max-w-xl gap-5';
  const header = document.createElement('header');
  header.innerHTML = '<h1 class="font-display text-3xl font-semibold">เครื่องสุ่มหวย</h1><p class="mt-2 text-sm text-muted">กดปุ่มเดียว สุ่มต่อเนื่องเป็นรอบ 2 ตัว → 3 ตัว → 6 ตัว</p>';
  const footer = document.createElement('p');
  footer.className = 'text-center text-xs text-muted';
  footer.textContent = 'เก็บประวัติ 30 รายการล่าสุดไว้ในอุปกรณ์นี้';
  main.append(header, pwa, steps, ticket, history, footer);
  return main;
}

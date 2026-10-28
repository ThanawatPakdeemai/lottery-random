export function Toast() {
  const element = document.createElement('div');
  element.className = 'fixed bottom-6 left-1/2 z-50 w-max max-w-[calc(100%-2rem)] -translate-x-1/2 rounded-xl bg-ink px-5 py-3 text-sm text-panel shadow-lg';
  element.setAttribute('role', 'status');
  element.hidden = true;
  let timer;
  return { element, show(message) {
    element.textContent = message;
    element.hidden = false;
    clearTimeout(timer);
    timer = setTimeout(() => { element.hidden = true; }, 3500);
  } };
}

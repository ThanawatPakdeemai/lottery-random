export function Digit(value, settled = false) {
  const digit = document.createElement('span');
  digit.className = `grid min-w-0 place-items-center rounded-xl border-2 bg-cell py-3 font-mono text-[clamp(1.5rem,8vw,3.5rem)] font-medium ${settled ? 'border-accent text-accent' : 'border-line text-muted'}`;
  digit.textContent = value;
  return digit;
}

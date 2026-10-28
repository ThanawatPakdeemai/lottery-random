export function Button(label, onClick, { primary = false, disabled = false, className = '' } = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  button.disabled = disabled;
  button.className = `${primary ? 'btn-primary' : 'btn'} ${className}`;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

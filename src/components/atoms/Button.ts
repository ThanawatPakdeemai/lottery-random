// All labels and attributes are internal static templates.
export function Button(id: string, label: string, disabled = false): string {
  return `<button class="ghost" id="${id}" type="button"${disabled ? ' disabled' : ''}>${label}</button>`;
}

// Utility for escaping user input when rendering innerHTML.
// Keeps the previous DOMPurify semantics by allowing no tags/attributes.
const escapeHtml = (unsafe) => unsafe
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

export function sanitize(value) {
  const raw = value ?? '';
  if (typeof document !== 'undefined') {
    const container = document.createElement('div');
    container.textContent = raw;
    return container.innerHTML;
  }
  return escapeHtml(String(raw));
}

/**
 * Paleta de colores para prestatarios (de agent.md).
 * Usada para asignar índices de clase CSS en lugar de estilos inline,
 * evitando riesgo de inyección CSS.
 */
export const BORROWER_PALETTE = ['#FF6B00', '#A855F7', '#06B6D4', '#10B981', '#F43F5E', '#F59E0B'];

/**
 * Obtiene el índice de color (0-5) para un préstamo.
 * Si el color no está en la paleta, retorna 0 (primary).
 * @param {string} [loanColor] - Color hex del préstamo
 * @returns {number} Índice 0-5
 */
export function getBorrowerColorIndex(loanColor) {
  if (!loanColor || typeof loanColor !== 'string') return 0;
  const normalized = loanColor.trim().toUpperCase();
  const idx = BORROWER_PALETTE.findIndex((c) => c.toUpperCase() === normalized);
  return idx >= 0 ? idx : 0;
}

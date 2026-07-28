import type { SubjectColor } from '@spa/shared-types';

/**
 * Escala de disciplinas — tons de marca-texto.
 * Só identificam matéria: nunca carregam significado semântico
 * (isso é papel exclusivo de tinta/caneta/quadro).
 */
export const SUBJECT_COLORS = [
  { key: 'amarelo', label: 'Amarelo', hex: '#FFE24D' },
  { key: 'limao', label: 'Limão', hex: '#9BF06B' },
  { key: 'rosa', label: 'Rosa', hex: '#FF7BC5' },
  { key: 'ciano', label: 'Ciano', hex: '#5CE1FF' },
  { key: 'lilas', label: 'Lilás', hex: '#B79BFF' },
  { key: 'laranja', label: 'Laranja', hex: '#FFA24D' },
] as const;

export function subjectHex(color: SubjectColor): string {
  return SUBJECT_COLORS[color]?.hex ?? SUBJECT_COLORS[0].hex;
}

/** Versão legível sobre fundo claro/escuro, para textos e traços de gráfico. */
export function subjectInk(color: SubjectColor): string {
  return `color-mix(in srgb, ${subjectHex(color)} 62%, var(--ink))`;
}

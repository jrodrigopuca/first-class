import type { Question } from "../../engine/types";

/**
 * Qué se está poniendo a prueba. Es lo que agrupa los ítems y lo que el
 * jugador puede filtrar.
 */
export const CLOZE_TYPE = {
  COLLOCATION: "collocation",
  PHRASAL: "phrasal",
  PREPOSITION: "preposition",
  LINKER: "linker",
  CONFUSABLE: "confusable",
} as const;

export type ClozeType = (typeof CLOZE_TYPE)[keyof typeof CLOZE_TYPE];

/** El examen siempre da cuatro opciones: la correcta y tres distractores. */
export const OPTION_COUNT = 4;
export const DISTRACTOR_COUNT = OPTION_COUNT - 1;

export interface ClozeQuestion extends Question {
  /** Punto de vocabulario que agrupa ítems emparentados: "do-vs-make". */
  family: string;
  category: ClozeType;
  label: string;
  /** La frase con ___ donde va la opción. */
  sentence: string;
  /**
   * La respuesta correcta, guardada como VALOR y no como índice.
   *
   * Es a propósito: las opciones se barajan en cada presentación, así que
   * un índice fijo no significaría nada. Y si no se barajaran, la POSICIÓN
   * se volvería la pista — memorizarías "la B" en vez de la colocación.
   */
  answer: string;
  /** Exactamente tres. Son la mitad del ejercicio, no relleno. */
  distractors: readonly string[];
  explanation: string;
}

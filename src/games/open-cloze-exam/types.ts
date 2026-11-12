import type { Difficulty, Question } from "../../engine/types";
import type { Paragraphs } from "../../exam/gappedText";

/**
 * Tipo de palabra gramatical. Misma taxonomía que la pre-práctica del
 * Part 2, declarada acá: los juegos no se importan entre sí.
 */
export const GAP_TYPE = {
  ARTICLE: "article",
  PREPOSITION: "preposition",
  AUXILIARY: "auxiliary",
  PRONOUN: "pronoun",
  QUANTIFIER: "quantifier",
  LINKER: "linker",
  FIXED_PHRASE: "fixed-phrase",
  COMPARATIVE: "comparative",
} as const;

export type GapType = (typeof GAP_TYPE)[keyof typeof GAP_TYPE];

/** La regla del Part 2: UNA palabra por hueco, contada como Cambridge. */
export const WORDS_PER_GAP = 1;

/** Huecos candidatos por texto, sin el ejemplo. 10 de los que salen 8. */
export const MIN_CANDIDATES = 10;

export interface TextGap extends Question {
  /**
   * Todas las respuestas aceptadas, normalizadas. La primera es la que
   * va en el marcador del texto y la que se muestra como solución.
   */
  answers: readonly string[];
  category: GapType;
  label: string;
  explanation: string;
}

export interface ClozeText {
  id: string;
  title: string;
  level: Difficulty;
  paragraphs: Paragraphs;
  /** En orden de aparición. El primero es SIEMPRE el ejemplo (0). */
  gaps: readonly TextGap[];
}

import type { Question } from "../../engine/types";

/**
 * Qué tipo de palabra gramatical se está practicando. El Part 2 casi
 * nunca pide vocabulario: pide las palabras que sostienen la gramática.
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

/** La regla del Part 2: UNA sola palabra por hueco. */
export const WORDS_PER_GAP = 1;

export interface OpenClozeQuestion extends Question {
  family: string;
  category: GapType;
  label: string;
  /** La frase con ___ donde va la palabra. */
  sentence: string;
  /** Todas las palabras aceptadas, en minúscula. A veces hay más de una. */
  answers: readonly string[];
  explanation: string;
}

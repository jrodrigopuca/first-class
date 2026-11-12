import type { Question } from "../../engine/types";
import type { AnswerHalves } from "../../exam/keyWord";

/**
 * Tipo de transformación. Misma taxonomía que la pre-práctica del Part 4,
 * declarada acá: los juegos no se importan entre sí.
 */
export const TRANSFORMATION = {
  PASSIVE: "passive",
  REPORTED: "reported",
  CONDITIONAL: "conditional",
  COMPARATIVE: "comparative",
  MODAL: "modal",
  VERB_PATTERN: "verb-pattern",
  EXPRESSION: "expression",
  PHRASAL: "phrasal",
} as const;

export type Transformation = (typeof TRANSFORMATION)[keyof typeof TRANSFORMATION];

/** Como en el examen: seis transformaciones por Part 4. */
export const ITEMS_PER_PAPER = 6;

export interface KeyWordItem extends Question {
  category: Transformation;
  label: string;
  /** La frase original, la que hay que reformular. */
  original: string;
  /** La palabra clave, en mayúsculas. Va sin cambiar. */
  keyWord: string;
  /** La segunda frase, con ___ donde va la respuesta. */
  gapped: string;
  /** Respuestas aceptadas, enteras y normalizadas. */
  answers: readonly string[];
  /** Las mismas, partidas en las dos mitades que puntúan. */
  halves: readonly AnswerHalves[];
  explanation: string;
}

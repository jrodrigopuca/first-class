import type { Question } from "../../engine/types";

/**
 * Tipo de transformación gramatical que se practica. Es lo que agrupa
 * los ítems y lo que el jugador puede filtrar.
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

/** Cambridge exige entre 2 y 5 palabras, palabra clave incluida. */
export const MIN_WORDS = 2;
export const MAX_WORDS = 5;

export interface KeyWordQuestion extends Question {
  /** Estructura gramatical que agrupa ítems emparentados. */
  family: string;
  category: Transformation;
  /** Etiqueta didáctica: "Pasiva con 'said'". */
  label: string;
  /** La frase original, la que hay que reformular. */
  original: string;
  /** La palabra clave, en mayúsculas. Va sin cambiar. */
  keyWord: string;
  /** La segunda frase, con ___ donde va la respuesta. */
  gapped: string;
  /** Todas las respuestas aceptadas, normalizadas y en minúscula. */
  answers: readonly string[];
  explanation: string;
}

import type { AnswerHalves } from "../../exam/keyWord";
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

/** Las reglas del Part 4 son de Cambridge: viven en exam/keyWord. */
export { MARKS_PER_ITEM, MAX_WORDS, MIN_WORDS, type AnswerHalves } from "../../exam/keyWord";

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
  /**
   * Las mismas respuestas, partidas en las dos mitades que puntúan. En el
   * JSON se escriben juntas con una barra: "is said | to be".
   */
  halves: readonly AnswerHalves[];
  explanation: string;
}

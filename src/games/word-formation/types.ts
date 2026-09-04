import type { Question } from "../../engine/types";

/**
 * Const object -> tipo derivado. No escribimos la unión a mano porque
 * así tenemos UN solo lugar de verdad: sirve en runtime (para iterar los
 * filtros de la UI) y en compilación (para tipar).
 */
export const WORD_CATEGORY = {
  NOUN: "noun",
  ADJECTIVE: "adjective",
  ADVERB: "adverb",
  VERB: "verb",
  PERSON: "person",
  PREFIX: "prefix",
} as const;

export type WordCategory = (typeof WORD_CATEGORY)[keyof typeof WORD_CATEGORY];

export interface WordFormationQuestion extends Question {
  /**
   * Lema que agrupa todas las formas emparentadas: "friend" cubre
   * friendship, friendly y unfriendly.
   *
   * Esta es la pieza que rompe el atajo mental. Cuando una raíz mapea
   * a UNA sola respuesta, el jugador memoriza el par y deja de leer la
   * frase. Con varias formas por familia, ver la raíz no le dice nada:
   * tiene que detectar qué categoría gramatical pide el hueco.
   */
  family: string;
  category: WordCategory;
  /** Etiqueta didáctica: "Sustantivo (-tion)". */
  label: string;
  /** La frase con ___ donde va la respuesta. */
  sentence: string;
  /**
   * La palabra que se MUESTRA en mayúsculas, como en el examen real.
   * No siempre coincide con la familia: la familia "friend" puede
   * pedirse desde FRIEND o desde FRIENDLY.
   */
  root: string;
  /** Todas las grafías aceptadas, en minúscula: ["summarize", "summarise"]. */
  answers: readonly string[];
  explanation: string;
}

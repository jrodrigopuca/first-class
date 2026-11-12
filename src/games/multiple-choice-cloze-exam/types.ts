import type { Difficulty, Question } from "../../engine/types";
import type { Paragraphs } from "../../exam/gappedText";

/**
 * Qué se pone a prueba en cada hueco. Es la misma taxonomía que la
 * pre-práctica del Part 1, pero declarada acá: los juegos no se importan
 * entre sí.
 */
export const CLOZE_TYPE = {
  COLLOCATION: "collocation",
  PHRASAL: "phrasal",
  PREPOSITION: "preposition",
  LINKER: "linker",
  CONFUSABLE: "confusable",
} as const;

export type ClozeType = (typeof CLOZE_TYPE)[keyof typeof CLOZE_TYPE];

/** Cuatro opciones por hueco: la correcta y tres distractores. */
export const DISTRACTORS_SHOWN = 3;

/**
 * Cada hueco trae entre 3 y 5 distractores y cada presentación muestra 3.
 * Los que sobran son variedad: la misma frase no siempre te ofrece las
 * mismas trampas.
 */
export const MIN_DISTRACTORS = DISTRACTORS_SHOWN;
export const MAX_DISTRACTORS = 5;

/**
 * Huecos candidatos por texto, sin contar el ejemplo. Con 10 candidatos y
 * 8 por examen hay 45 combinaciones por texto: lo que retrasa que te lo
 * sepas de memoria.
 */
export const MIN_CANDIDATES = 10;

export interface TextGap extends Question {
  /** La palabra tal como va en el texto, en minúscula. */
  answer: string;
  /** Entre MIN y MAX. Todos tienen que ser INCORRECTOS en ese contexto. */
  distractors: readonly string[];
  category: ClozeType;
  label: string;
  explanation: string;
}

export interface ClozeText {
  id: string;
  title: string;
  level: Difficulty;
  paragraphs: Paragraphs;
  /**
   * Todos los huecos en orden de aparición. El primero es SIEMPRE el
   * ejemplo (0), como en el examen; el resto son candidatos.
   */
  gaps: readonly TextGap[];
}

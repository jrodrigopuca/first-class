import type { Difficulty, Question } from "../../engine/types";
import type { Paragraphs } from "../../exam/gappedText";

/** Misma taxonomía que la pre-práctica del Part 3, declarada acá. */
export const WORD_CATEGORY = {
  NOUN: "noun",
  ADJECTIVE: "adjective",
  ADVERB: "adverb",
  VERB: "verb",
  PERSON: "person",
  PREFIX: "prefix",
} as const;

export type WordCategory = (typeof WORD_CATEGORY)[keyof typeof WORD_CATEGORY];

/** UNA palabra por hueco, como en el examen. */
export const WORDS_PER_GAP = 1;

/** Huecos candidatos por texto, sin el ejemplo. 10 de los que salen 8. */
export const MIN_CANDIDATES = 10;

/**
 * Proporción mínima de huecos cuya raíz aparece en OTRO hueco del dataset
 * pidiendo otra forma (EXPECT → unexpected / expectations).
 *
 * Es la mecánica central del Part 3 (decisión #4): si una raíz pidiera
 * siempre lo mismo, verla alcanzaría para responder sin leer la frase.
 * Es más bajo que el 85% de la pre-práctica porque acá cada raíz tiene
 * que entrar en un texto con tema propio, y forzarlas degrada los textos.
 * Ver decisión #17.
 */
export const ROOT_REUSE_FLOOR = 0.5;

export interface TextGap extends Question {
  /** La palabra que se muestra al lado del hueco, en MAYÚSCULAS. */
  root: string;
  /** Grafías aceptadas, normalizadas. La primera va en el marcador. */
  answers: readonly string[];
  category: WordCategory;
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

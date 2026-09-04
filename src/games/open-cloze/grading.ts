import { countWords, normalize } from "../../exam/text";
import { WORDS_PER_GAP, type OpenClozeQuestion } from "./types";

/**
 * Corrección del Part 2. Reutiliza las reglas de texto compartidas
 * (../../exam/text): mismo contador de palabras que el Part 4, así una
 * contracción cuenta igual en los dos juegos.
 */

export const SUBMISSION_ISSUE = {
  EMPTY: "empty",
  TOO_MANY: "too-many",
} as const;

export type SubmissionIssue = (typeof SUBMISSION_ISSUE)[keyof typeof SUBMISSION_ISSUE];

/**
 * El Part 2 admite UNA palabra y nada más.
 *
 * Ojo con las contracciones: "don't" se ve como una palabra pero son
 * do + not, y el examen la rechaza. Por eso el conteo pasa por el mismo
 * countWords que usa el Part 4 y no por un split con espacios.
 */
export function findSubmissionIssue(raw: string): SubmissionIssue | null {
  const clean = normalize(raw);
  if (clean === "") return SUBMISSION_ISSUE.EMPTY;
  if (countWords(clean) > WORDS_PER_GAP) return SUBMISSION_ISSUE.TOO_MANY;
  return null;
}

export function isCorrect(question: OpenClozeQuestion, answer: string): boolean {
  return question.answers.includes(normalize(answer));
}

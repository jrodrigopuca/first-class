import { countWords, normalize, wordsOf } from "../../exam/text";
import { MAX_WORDS, MIN_WORDS, type KeyWordQuestion } from "./types";

/**
 * Corrección del Part 4. Las reglas de texto compartidas viven en
 * ../../exam/text; acá queda solo lo que es propio de esta parte.
 */

export { countWords, normalize };

export const SUBMISSION_ISSUE = {
  EMPTY: "empty",
  TOO_FEW: "too-few",
  TOO_MANY: "too-many",
  MISSING_KEY_WORD: "missing-key-word",
} as const;

export type SubmissionIssue = (typeof SUBMISSION_ISSUE)[keyof typeof SUBMISSION_ISSUE];

/**
 * Reglas del examen que se comprueban ANTES de corregir.
 *
 * Ojo con la distinción, que no es cosmética: pasarse de cinco palabras
 * no es "responder mal", es una respuesta INVÁLIDA. En el examen te dan
 * cero igual, pero para aprender no es lo mismo equivocarte de estructura
 * que pasarte de largo. Por eso esto devuelve un problema concreto y el
 * intento ni siquiera llega al motor de puntaje.
 */
export function findSubmissionIssue(
  question: KeyWordQuestion,
  raw: string,
): SubmissionIssue | null {
  const clean = normalize(raw);
  if (clean === "") return SUBMISSION_ISSUE.EMPTY;

  const wordCount = countWords(clean);
  if (wordCount < MIN_WORDS) return SUBMISSION_ISSUE.TOO_FEW;
  if (wordCount > MAX_WORDS) return SUBMISSION_ISSUE.TOO_MANY;

  // La clave se busca en la forma escrita Y en la expandida: si el
  // alumno escribe "cannot" y la clave es CANNOT, expandir a "can not"
  // haría desaparecer la palabra que estamos buscando.
  if (!wordsOf(clean).has(question.keyWord.toLowerCase())) {
    return SUBMISSION_ISSUE.MISSING_KEY_WORD;
  }

  return null;
}

/** Corrección propiamente dicha. Asume que ya pasó findSubmissionIssue. */
export function isCorrect(question: KeyWordQuestion, answer: string): boolean {
  return question.answers.includes(normalize(answer));
}

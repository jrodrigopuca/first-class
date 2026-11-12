import {
  findSubmissionIssue as findIssue,
  markAnswer as mark,
  MARKS_PER_ITEM,
  type Marking,
} from "../../exam/keyWord";
import { countWords, normalize } from "../../exam/text";
import type { KeyWordQuestion } from "./types";

/**
 * Corrección del Part 4. Las reglas (validación previa y puntaje en dos
 * mitades) son de Cambridge y viven en ../../exam/keyWord, compartidas
 * con la práctica intensiva. Acá solo se adaptan a la pregunta del juego.
 */

export { countWords, normalize };
export { SUBMISSION_ISSUE, type Marking, type SubmissionIssue } from "../../exam/keyWord";

export function findSubmissionIssue(question: KeyWordQuestion, raw: string) {
  return findIssue(question.keyWord, raw);
}

export function markAnswer(question: KeyWordQuestion, raw: string): Marking {
  return mark(question.halves, raw);
}

/**
 * Para el motor, "correcto" es la respuesta completa: 2 de 2. Así la
 * repetición espaciada te vuelve a mostrar lo que te salió a medias.
 */
export function isCorrect(question: KeyWordQuestion, answer: string): boolean {
  return markAnswer(question, answer).marks === MARKS_PER_ITEM;
}

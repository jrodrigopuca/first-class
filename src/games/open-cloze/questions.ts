import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { countWords, normalize } from "../../exam/text";
import { GAP_TYPE, WORDS_PER_GAP, type GapType, type OpenClozeQuestion } from "./types";

import rawQuestions from "./questions.json";

/**
 * Validación en la frontera.
 *
 * Lo propio del Part 2: cada respuesta tiene que ser UNA palabra según
 * el conteo de Cambridge. Y como usa el mismo countWords que el juego,
 * es imposible que exista contenido que pase el control y que el juego
 * después rechace.
 */

const TYPES: readonly string[] = Object.values(GAP_TYPE);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type RawQuestion = (typeof rawQuestions)[number];

function isGapType(value: string): value is GapType {
  return TYPES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

function fail(raw: RawQuestion, problem: string): never {
  throw new Error(`[open-cloze] "${raw.id}": ${problem}`);
}

function parseQuestion(raw: RawQuestion): OpenClozeQuestion {
  if (!ID_SHAPE.test(raw.id)) fail(raw, "el id debe ser kebab-case estable");
  if (!isGapType(raw.category)) fail(raw, `categoría inválida "${raw.category}"`);
  if (!isDifficulty(raw.level)) fail(raw, `nivel inválido "${raw.level}"`);
  if (!raw.sentence.includes("___")) fail(raw, "la frase no tiene hueco '___'");
  if (raw.sentence.trimStart().startsWith("___")) {
    // Si el hueco abriera la frase, la respuesta iría en mayúscula y
    // habría que aceptar las dos grafías por un motivo puramente visual.
    fail(raw, "el hueco no puede abrir la frase");
  }
  if (raw.answers.length === 0) fail(raw, "sin respuestas");

  for (const answer of raw.answers) {
    if (answer !== normalize(answer)) fail(raw, `la respuesta "${answer}" no está normalizada`);
    const words = countWords(answer);
    if (words !== WORDS_PER_GAP) {
      fail(raw, `"${answer}" son ${words} palabras y el Part 2 admite ${WORDS_PER_GAP}`);
    }
  }

  return { ...raw, category: raw.category, level: raw.level };
}

function assertDatasetIsSane(questions: readonly OpenClozeQuestion[]): void {
  const seenIds = new Set<string>();
  const answersByFamily = new Map<string, Map<string, string>>();

  for (const question of questions) {
    if (seenIds.has(question.id)) {
      throw new Error(`[open-cloze] id duplicado: "${question.id}"`);
    }
    seenIds.add(question.id);

    const familyAnswers = answersByFamily.get(question.family) ?? new Map();
    for (const answer of question.answers) {
      const owner = familyAnswers.get(answer);
      if (owner !== undefined) {
        throw new Error(
          `[open-cloze] respuesta ambigua "${answer}": la aceptan "${owner}" y "${question.id}" (familia "${question.family}")`,
        );
      }
      familyAnswers.set(answer, question.id);
    }
    answersByFamily.set(question.family, familyAnswers);
  }
}

export const QUESTIONS: readonly OpenClozeQuestion[] = rawQuestions.map(parseQuestion);

assertDatasetIsSane(QUESTIONS);

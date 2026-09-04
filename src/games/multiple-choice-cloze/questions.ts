import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { CLOZE_TYPE, DISTRACTOR_COUNT, type ClozeQuestion, type ClozeType } from "./types";

import rawQuestions from "./questions.json";

/**
 * Validación en la frontera, igual que en los otros dos juegos.
 *
 * Lo específico de acá: los distractores. Un ítem con dos opciones
 * idénticas, o con menos de tres distractores, se vería normal en la
 * pantalla y arruinaría el ejercicio en silencio.
 */

const TYPES: readonly string[] = Object.values(CLOZE_TYPE);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type RawQuestion = (typeof rawQuestions)[number];

function isClozeType(value: string): value is ClozeType {
  return TYPES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

function fail(raw: RawQuestion, problem: string): never {
  throw new Error(`[multiple-choice-cloze] "${raw.id}": ${problem}`);
}

function parseQuestion(raw: RawQuestion): ClozeQuestion {
  if (!ID_SHAPE.test(raw.id)) fail(raw, "el id debe ser kebab-case estable");
  if (!isClozeType(raw.category)) fail(raw, `categoría inválida "${raw.category}"`);
  if (!isDifficulty(raw.level)) fail(raw, `nivel inválido "${raw.level}"`);
  if (!raw.sentence.includes("___")) fail(raw, "la frase no tiene hueco '___'");
  if (raw.sentence.trimStart().startsWith("___")) {
    // Si el hueco abriera la frase, la opción correcta tendría que ir en
    // mayúscula y las otras tres no: la mayúscula sería la pista.
    fail(raw, "el hueco no puede abrir la frase");
  }
  if (raw.distractors.length !== DISTRACTOR_COUNT) {
    fail(raw, `tiene ${raw.distractors.length} distractores y necesita ${DISTRACTOR_COUNT}`);
  }

  const options = [raw.answer, ...raw.distractors];
  if (new Set(options).size !== options.length) {
    fail(raw, `opciones repetidas: ${options.join(", ")}`);
  }
  for (const option of options) {
    if (option !== option.trim().toLowerCase()) {
      fail(raw, `la opción "${option}" no está normalizada`);
    }
  }

  return { ...raw, category: raw.category, level: raw.level };
}

function assertDatasetIsSane(questions: readonly ClozeQuestion[]): void {
  const seenIds = new Set<string>();
  for (const question of questions) {
    if (seenIds.has(question.id)) {
      throw new Error(`[multiple-choice-cloze] id duplicado: "${question.id}"`);
    }
    seenIds.add(question.id);
  }
}

export const QUESTIONS: readonly ClozeQuestion[] = rawQuestions.map(parseQuestion);

assertDatasetIsSane(QUESTIONS);

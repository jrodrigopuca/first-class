import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { countWords, normalize } from "./grading";
import {
  MAX_WORDS,
  MIN_WORDS,
  TRANSFORMATION,
  type KeyWordQuestion,
  type Transformation,
} from "./types";

import rawQuestions from "./questions.json";

/**
 * Validación en la frontera, igual que en word-formation.
 *
 * Acá es todavía más necesaria: un ítem del Part 4 puede estar mal de
 * cinco maneras distintas, y ninguna se ve a simple vista. La más
 * traicionera es que la palabra clave quede FUERA del hueco — la frase
 * se lee perfecta y el ejercicio es inválido.
 *
 * Y fijate que cuenta palabras con countWords(), el MISMO que usa el
 * juego para corregir. Si validaras con otra lógica, tendrías un dataset
 * que pasa el control y respuestas que el juego rechaza.
 */

const TRANSFORMATIONS: readonly string[] = Object.values(TRANSFORMATION);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type RawQuestion = (typeof rawQuestions)[number];

function isTransformation(value: string): value is Transformation {
  return TRANSFORMATIONS.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

function fail(raw: RawQuestion, problem: string): never {
  throw new Error(`[key-word-transformation] "${raw.id}": ${problem}`);
}

function parseQuestion(raw: RawQuestion): KeyWordQuestion {
  if (!ID_SHAPE.test(raw.id)) fail(raw, "el id debe ser kebab-case estable");
  if (!isTransformation(raw.category)) fail(raw, `categoría inválida "${raw.category}"`);
  if (!isDifficulty(raw.level)) fail(raw, `nivel inválido "${raw.level}"`);
  if (!raw.gapped.includes("___")) fail(raw, "la frase incompleta no tiene hueco '___'");
  if (raw.keyWord !== raw.keyWord.toUpperCase()) {
    fail(raw, `la palabra clave va en mayúsculas, no "${raw.keyWord}"`);
  }
  if (raw.answers.length === 0) fail(raw, "sin respuestas");

  const key = raw.keyWord.toLowerCase();
  for (const answer of raw.answers) {
    if (answer !== normalize(answer)) {
      fail(raw, `la respuesta "${answer}" no está normalizada`);
    }
    const words = countWords(answer);
    if (words < MIN_WORDS || words > MAX_WORDS) {
      fail(raw, `"${answer}" tiene ${words} palabras; Cambridge exige ${MIN_WORDS}-${MAX_WORDS}`);
    }
    if (!answer.split(" ").includes(key)) {
      fail(raw, `"${answer}" no contiene la palabra clave ${raw.keyWord}`);
    }
  }

  return { ...raw, category: raw.category, level: raw.level };
}

function assertDatasetIsSane(questions: readonly KeyWordQuestion[]): void {
  const seenIds = new Set<string>();
  const answersByFamily = new Map<string, Map<string, string>>();

  for (const question of questions) {
    if (seenIds.has(question.id)) {
      throw new Error(`[key-word-transformation] id duplicado: "${question.id}"`);
    }
    seenIds.add(question.id);

    const familyAnswers = answersByFamily.get(question.family) ?? new Map();
    for (const answer of question.answers) {
      const owner = familyAnswers.get(answer);
      if (owner !== undefined) {
        throw new Error(
          `[key-word-transformation] respuesta ambigua "${answer}": la aceptan "${owner}" y "${question.id}" (familia "${question.family}")`,
        );
      }
      familyAnswers.set(answer, question.id);
    }
    answersByFamily.set(question.family, familyAnswers);
  }
}

export const QUESTIONS: readonly KeyWordQuestion[] = rawQuestions.map(parseQuestion);

assertDatasetIsSane(QUESTIONS);

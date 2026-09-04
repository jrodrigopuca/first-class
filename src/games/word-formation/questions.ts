import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { WORD_CATEGORY, type WordCategory, type WordFormationQuestion } from "./types";

import rawQuestions from "./questions.json";

/**
 * El JSON entra al sistema de tipos como `string` y `number` pelados.
 * Validamos EN LA FRONTERA en vez de hacer `as WordFormationQuestion[]`,
 * que sería mentirle al compilador.
 *
 * ¿Paranoia por unas pocas preguntas? No. Este dataset lo vas a editar
 * a mano y va a crecer a cientos. El día que escribas "adjetive" o
 * repitas un id querés reventar al arrancar la app, no descubrirlo tres
 * semanas después porque un filtro devolvía vacío en silencio.
 */

const CATEGORIES: readonly string[] = Object.values(WORD_CATEGORY);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

type RawQuestion = (typeof rawQuestions)[number];

function isWordCategory(value: string): value is WordCategory {
  return CATEGORIES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

function fail(raw: RawQuestion, problem: string): never {
  throw new Error(`[word-formation] "${raw.id}": ${problem}`);
}

function parseQuestion(raw: RawQuestion): WordFormationQuestion {
  if (!ID_SHAPE.test(raw.id)) {
    fail(raw, `el id debe ser kebab-case estable, no "${raw.id}"`);
  }
  if (!isWordCategory(raw.category)) {
    fail(raw, `categoría inválida "${raw.category}"`);
  }
  if (!isDifficulty(raw.level)) {
    fail(raw, `nivel inválido "${raw.level}"`);
  }
  if (!raw.sentence.includes("___")) {
    fail(raw, "la frase no tiene hueco '___'");
  }
  if (raw.root !== raw.root.toUpperCase()) {
    fail(raw, `la raíz va en mayúsculas, no "${raw.root}"`);
  }
  if (raw.answers.length === 0) {
    fail(raw, "sin respuestas");
  }
  for (const answer of raw.answers) {
    if (answer !== answer.trim().toLowerCase()) {
      fail(raw, `la respuesta "${answer}" tiene que estar normalizada`);
    }
    if (answer === raw.root.toLowerCase()) {
      fail(raw, `la respuesta "${answer}" es la raíz sin transformar`);
    }
  }

  return { ...raw, category: raw.category, level: raw.level };
}

/**
 * Chequeos que NO se pueden hacer mirando una pregunta sola.
 *
 * El segundo es el que importa desde que hay varias formas por familia:
 * si dos preguntas de la familia "friend" aceptaran ambas "friendly",
 * el jugador podría acertar una con la respuesta de la otra y el
 * ejercicio dejaría de enseñar nada.
 */
function assertDatasetIsSane(questions: readonly WordFormationQuestion[]): void {
  const seenIds = new Set<string>();
  const seenAnswersByFamily = new Map<string, Map<string, string>>();

  for (const question of questions) {
    if (seenIds.has(question.id)) {
      throw new Error(`[word-formation] id duplicado: "${question.id}"`);
    }
    seenIds.add(question.id);

    const familyAnswers = seenAnswersByFamily.get(question.family) ?? new Map();
    for (const answer of question.answers) {
      const owner = familyAnswers.get(answer);
      if (owner !== undefined) {
        throw new Error(
          `[word-formation] respuesta ambigua "${answer}": la aceptan "${owner}" y "${question.id}" (familia "${question.family}")`,
        );
      }
      familyAnswers.set(answer, question.id);
    }
    seenAnswersByFamily.set(question.family, familyAnswers);
  }
}

export const QUESTIONS: readonly WordFormationQuestion[] = rawQuestions.map(parseQuestion);

assertDatasetIsSane(QUESTIONS);

/** Cuántas formas distintas se practican por familia. Útil para medir cobertura. */
export function countByFamily(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();
  for (const question of QUESTIONS) {
    counts.set(question.family, (counts.get(question.family) ?? 0) + 1);
  }
  return counts;
}

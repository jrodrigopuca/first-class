import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { parseMarkedAnswer } from "../../exam/keyWord";
import { TRANSFORMATION, type KeyWordItem, type Transformation } from "./types";

import rawItems from "./questions.json";

/**
 * Validación en la frontera. Las reglas de cada respuesta (dos mitades,
 * 2–5 palabras contadas como Cambridge, la clave DENTRO del hueco) son
 * del examen y viven en exam/keyWord: las mismas que la pre-práctica.
 */

const TRANSFORMATIONS: readonly string[] = Object.values(TRANSFORMATION);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface RawItem {
  id: string;
  category: string;
  label: string;
  level: number;
  original: string;
  keyWord: string;
  gapped: string;
  answers: readonly string[];
  explanation: string;
}

function isTransformation(value: string): value is Transformation {
  return TRANSFORMATIONS.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

export function parseItem(raw: RawItem): KeyWordItem {
  const fail = (problem: string): never => {
    throw new Error(`[key-word-transformation-exam] "${raw.id}": ${problem}`);
  };

  if (!ID_SHAPE.test(raw.id)) fail("el id debe ser kebab-case estable");
  const category = isTransformation(raw.category) ? raw.category : fail(`categoría inválida "${raw.category}"`);
  const level = isDifficulty(raw.level) ? raw.level : fail(`nivel inválido "${raw.level}"`);
  if (raw.gapped.split("___").length !== 2) fail("la frase incompleta tiene que tener exactamente un '___'");
  if (raw.gapped.trimStart().startsWith("___")) fail("el hueco no puede abrir la frase");
  if (raw.keyWord !== raw.keyWord.toUpperCase() || raw.keyWord.includes(" ")) {
    fail(`la palabra clave va en mayúsculas y es una sola, no "${raw.keyWord}"`);
  }
  if (raw.label.trim() === "" || raw.explanation.trim() === "") fail("falta la etiqueta o la explicación");
  if (raw.answers.length === 0) fail("sin respuestas");

  const parsed = raw.answers.map((marked) => {
    try {
      return parseMarkedAnswer(raw.keyWord, marked);
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error));
    }
  });

  return {
    id: raw.id,
    level,
    category,
    label: raw.label,
    original: raw.original,
    keyWord: raw.keyWord,
    gapped: raw.gapped,
    answers: parsed.map(({ full }) => full),
    halves: parsed.map(({ halves }) => halves),
    explanation: raw.explanation,
  };
}

function assertDatasetIsSane(items: readonly KeyWordItem[]): void {
  const seen = new Set<string>();
  for (const item of items) {
    if (seen.has(item.id)) throw new Error(`[key-word-transformation-exam] id duplicado: "${item.id}"`);
    seen.add(item.id);
  }
}

const RAW_ITEMS: readonly RawItem[] = rawItems;

export const ITEMS: readonly KeyWordItem[] = RAW_ITEMS.map(parseItem);

assertDatasetIsSane(ITEMS);

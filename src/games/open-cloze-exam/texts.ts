import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { parseGappedText } from "../../exam/gappedText";
import { countWords, normalize } from "../../exam/text";
import {
  GAP_TYPE,
  MIN_CANDIDATES,
  WORDS_PER_GAP,
  type ClozeText,
  type GapType,
  type TextGap,
} from "./types";

import rawTexts from "./texts.json";

/**
 * Validación en la frontera. La forma del texto la valida exam/gappedText;
 * acá, lo del Part 2: cada respuesta aceptada es UNA palabra según
 * Cambridge. Una respuesta "don't" en el dataset le enseñaría al alumno
 * algo que el examen le marca mal.
 */

const TYPES: readonly string[] = Object.values(GAP_TYPE);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export interface RawGap {
  answers: readonly string[];
  category: string;
  label: string;
  explanation: string;
}

export interface RawText {
  id: string;
  title: string;
  level: number;
  paragraphs: readonly string[];
  gaps: readonly RawGap[];
}

function isGapType(value: string): value is GapType {
  return TYPES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

export function parseText(raw: RawText): ClozeText {
  const fail = (problem: string): never => {
    throw new Error(`[open-cloze-exam] "${raw.id}": ${problem}`);
  };

  if (!ID_SHAPE.test(raw.id)) fail("el id debe ser kebab-case estable");
  const level = isDifficulty(raw.level) ? raw.level : fail(`nivel inválido "${raw.level}"`);
  if (raw.title.trim() === "") fail("falta el título");

  const { paragraphs, markers } = (() => {
    try {
      return parseGappedText(raw.paragraphs);
    } catch (error) {
      return fail(error instanceof Error ? error.message : String(error));
    }
  })();

  if (markers.length !== raw.gaps.length) {
    fail(`el texto tiene ${markers.length} marcadores y la lista ${raw.gaps.length} huecos`);
  }
  if (raw.gaps.length - 1 < MIN_CANDIDATES) {
    fail(`tiene ${raw.gaps.length - 1} huecos candidatos (sin el ejemplo); el mínimo es ${MIN_CANDIDATES}`);
  }

  const seen = new Set<string>();
  const gaps: TextGap[] = raw.gaps.map((gap, index) => {
    const [first] = gap.answers;
    const where = `hueco ${index} {${first ?? ""}}`;

    if (first === undefined) return fail(`${where}: no tiene respuestas`);
    if (markers[index] !== first) {
      fail(`${where}: el marcador del texto dice {${markers[index] ?? ""}}; ¿se desfasó la lista?`);
    }
    const category = isGapType(gap.category)
      ? gap.category
      : fail(`${where}: categoría inválida "${gap.category}"`);
    if (gap.label.trim() === "" || gap.explanation.trim() === "") {
      fail(`${where}: falta la etiqueta o la explicación`);
    }
    for (const answer of gap.answers) {
      if (answer !== normalize(answer)) fail(`${where}: "${answer}" no está normalizada`);
      if (countWords(answer) !== WORDS_PER_GAP) {
        fail(`${where}: "${answer}" son ${countWords(answer)} palabras según Cambridge; el Part 2 admite una`);
      }
    }
    if (new Set(gap.answers).size !== gap.answers.length) fail(`${where}: respuestas repetidas`);
    if (seen.has(first)) fail(`${where}: la respuesta se repite en el mismo texto`);
    seen.add(first);

    return {
      id: `${raw.id}-${first}`,
      level,
      answers: gap.answers,
      category,
      label: gap.label,
      explanation: gap.explanation,
    };
  });

  return { id: raw.id, title: raw.title, level, paragraphs, gaps };
}

function assertDatasetIsSane(texts: readonly ClozeText[]): void {
  const seen = new Set<string>();
  for (const text of texts) {
    for (const id of [text.id, ...text.gaps.map((gap) => gap.id)]) {
      if (seen.has(id)) throw new Error(`[open-cloze-exam] id duplicado: "${id}"`);
      seen.add(id);
    }
  }
}

const RAW_TEXTS: readonly RawText[] = rawTexts;

export const TEXTS: readonly ClozeText[] = RAW_TEXTS.map(parseText);

assertDatasetIsSane(TEXTS);

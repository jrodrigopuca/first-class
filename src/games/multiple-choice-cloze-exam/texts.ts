import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { parseGappedText, sentenceAround as sentenceIn } from "../../exam/gappedText";
import {
  CLOZE_TYPE,
  MAX_DISTRACTORS,
  MIN_CANDIDATES,
  MIN_DISTRACTORS,
  type ClozeText,
  type ClozeType,
  type TextGap,
} from "./types";

import rawTexts from "./texts.json";

/**
 * Validación en la frontera. Las reglas de FORMA del texto (huecos que
 * abren frase, distancia entre huecos, marcadores) son de los tres Parts
 * y viven en exam/gappedText. Acá van las del Part 1: distractores.
 */

const TYPES: readonly string[] = Object.values(CLOZE_TYPE);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const OPTION_SHAPE = /^[a-z]+(?:[ '-][a-z]+)*$/;

export interface RawGap {
  answer: string;
  distractors: readonly string[];
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

function isClozeType(value: string): value is ClozeType {
  return TYPES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

export function gapIdOf(textId: string, answer: string): string {
  return `${textId}-${answer.replace(/[\s']+/g, "-")}`;
}

export function parseText(raw: RawText): ClozeText {
  const fail = (problem: string): never => {
    throw new Error(`[multiple-choice-cloze-exam] "${raw.id}": ${problem}`);
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
    fail(
      `tiene ${raw.gaps.length - 1} huecos candidatos (sin el ejemplo); ` +
        `el mínimo es ${MIN_CANDIDATES}`,
    );
  }

  const seenAnswers = new Set<string>();
  const gaps: TextGap[] = raw.gaps.map((gap, index) => {
    const where = `hueco ${index} {${gap.answer}}`;

    if (markers[index] !== gap.answer) {
      fail(`${where}: el marcador del texto dice {${markers[index] ?? ""}}; ¿se desfasó la lista?`);
    }
    const category = isClozeType(gap.category)
      ? gap.category
      : fail(`${where}: categoría inválida "${gap.category}"`);
    if (gap.label.trim() === "" || gap.explanation.trim() === "") {
      fail(`${where}: falta la etiqueta o la explicación`);
    }
    if (gap.distractors.length < MIN_DISTRACTORS || gap.distractors.length > MAX_DISTRACTORS) {
      fail(
        `${where}: tiene ${gap.distractors.length} distractores; ` +
          `van entre ${MIN_DISTRACTORS} y ${MAX_DISTRACTORS}`,
      );
    }

    const options = [gap.answer, ...gap.distractors];
    if (new Set(options).size !== options.length) {
      fail(`${where}: opciones repetidas: ${options.join(", ")}`);
    }
    for (const option of options) {
      if (!OPTION_SHAPE.test(option)) fail(`${where}: la opción "${option}" no está normalizada`);
    }

    if (seenAnswers.has(gap.answer)) {
      // Además de romper el id, dos huecos con la misma respuesta en un
      // texto se delatan entre sí.
      fail(`${where}: la respuesta se repite en el mismo texto`);
    }
    seenAnswers.add(gap.answer);

    return {
      id: gapIdOf(raw.id, gap.answer),
      level,
      answer: gap.answer,
      distractors: gap.distractors,
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
      if (seen.has(id)) throw new Error(`[multiple-choice-cloze-exam] id duplicado: "${id}"`);
      seen.add(id);
    }
  }
}

const RAW_TEXTS: readonly RawText[] = rawTexts;

export const TEXTS: readonly ClozeText[] = RAW_TEXTS.map(parseText);

assertDatasetIsSane(TEXTS);

/** La frase del hueco, con los demás resueltos. Para el repaso. */
export function sentenceAround(text: ClozeText, gapIndex: number): string {
  return sentenceIn(text.paragraphs, gapIndex, (i) => text.gaps[i]?.answer ?? "");
}

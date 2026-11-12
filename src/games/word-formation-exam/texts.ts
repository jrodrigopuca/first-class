import { DIFFICULTY, type Difficulty } from "../../engine/types";
import { parseGappedText, sentenceAround as sentenceIn } from "../../exam/gappedText";
import { countWords, normalize } from "../../exam/text";
import {
  MIN_CANDIDATES,
  WORD_CATEGORY,
  WORDS_PER_GAP,
  type ClozeText,
  type TextGap,
  type WordCategory,
} from "./types";

import rawTexts from "./texts.json";

/**
 * Validación en la frontera. La forma del texto la valida exam/gappedText;
 * acá van las reglas del Part 3: la raíz se muestra en mayúsculas, hay que
 * TRANSFORMARLA (copiarla no puede ser la respuesta), y una raíz no puede
 * pedir la misma forma en dos textos.
 */

const CATEGORIES: readonly string[] = Object.values(WORD_CATEGORY);
const LEVELS: readonly number[] = Object.values(DIFFICULTY);
const ID_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ROOT_SHAPE = /^[A-Z]+$/;

export interface RawGap {
  root: string;
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

function isCategory(value: string): value is WordCategory {
  return CATEGORIES.includes(value);
}

function isDifficulty(value: number): value is Difficulty {
  return LEVELS.includes(value);
}

export function parseText(raw: RawText): ClozeText {
  const fail = (problem: string): never => {
    throw new Error(`[word-formation-exam] "${raw.id}": ${problem}`);
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
    if (!ROOT_SHAPE.test(gap.root)) fail(`${where}: la raíz "${gap.root}" va en MAYÚSCULAS y es una palabra`);
    const category = isCategory(gap.category)
      ? gap.category
      : fail(`${where}: categoría inválida "${gap.category}"`);
    if (gap.label.trim() === "" || gap.explanation.trim() === "") {
      fail(`${where}: falta la etiqueta o la explicación`);
    }
    for (const answer of gap.answers) {
      if (answer !== normalize(answer)) fail(`${where}: "${answer}" no está normalizada`);
      if (countWords(answer) !== WORDS_PER_GAP) fail(`${where}: "${answer}" no es una sola palabra`);
      if (answer === gap.root.toLowerCase()) {
        // Copiar la raíz nunca puede ser correcto: el ejercicio ES la
        // transformación.
        fail(`${where}: la respuesta "${answer}" es la raíz sin transformar`);
      }
    }
    if (seen.has(first)) fail(`${where}: la respuesta se repite en el mismo texto`);
    seen.add(first);

    return {
      id: `${raw.id}-${first}`,
      level,
      root: gap.root,
      answers: gap.answers,
      category,
      label: gap.label,
      explanation: gap.explanation,
    };
  });

  return { id: raw.id, title: raw.title, level, paragraphs, gaps };
}

function assertDatasetIsSane(texts: readonly ClozeText[]): void {
  const seenIds = new Set<string>();
  const formOwner = new Map<string, string>();

  for (const text of texts) {
    for (const id of [text.id, ...text.gaps.map((gap) => gap.id)]) {
      if (seenIds.has(id)) throw new Error(`[word-formation-exam] id duplicado: "${id}"`);
      seenIds.add(id);
    }
    for (const gap of text.gaps) {
      // La misma raíz pidiendo la misma forma en dos textos es justo el
      // par raíz → respuesta que el Part 3 tiene que romper.
      const key = `${gap.root}→${gap.answers[0] ?? ""}`;
      const owner = formOwner.get(key);
      if (owner !== undefined) {
        throw new Error(`[word-formation-exam] ${key} se pide en "${owner}" y en "${gap.id}": usá otra forma`);
      }
      formOwner.set(key, gap.id);
    }
  }
}

const RAW_TEXTS: readonly RawText[] = rawTexts;

export const TEXTS: readonly ClozeText[] = RAW_TEXTS.map(parseText);

assertDatasetIsSane(TEXTS);

/** La frase del hueco, con los demás resueltos. Para el repaso. */
export function sentenceAround(text: ClozeText, gapIndex: number): string {
  return sentenceIn(text.paragraphs, gapIndex, (i) => text.gaps[i]?.answers[0] ?? "");
}

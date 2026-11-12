import { drawGaps } from "../../exam/gappedText";
import { countWords, normalize } from "../../exam/text";
import { shuffle } from "../../lib/shuffle";
import { WORDS_PER_GAP, type ClozeText, type TextGap } from "./types";

/** Un intento: un texto, su ejemplo y ocho huecos sorteados. */

export interface PaperGap {
  /** 0 es el ejemplo; 1–8, los huecos a responder. */
  number: number;
  /** Posición del hueco en `text.gaps`. */
  index: number;
  gap: TextGap;
}

export interface Paper {
  text: ClozeText;
  example: PaperGap;
  gaps: readonly PaperGap[];
}

export function pickText(texts: readonly ClozeText[], previousId?: string): ClozeText {
  const pool = texts.length > 1 ? texts.filter((text) => text.id !== previousId) : texts;
  const text = shuffle(pool)[0];
  if (text === undefined) throw new Error("[open-cloze-exam] no hay textos");
  return text;
}

export function buildPaper(text: ClozeText): Paper {
  const example = text.gaps[0];
  if (example === undefined) throw new Error(`[open-cloze-exam] "${text.id}" sin huecos`);

  return {
    text,
    example: { number: 0, index: 0, gap: example },
    gaps: drawGaps(text.gaps.length).flatMap((index, i) => {
      const gap = text.gaps[index];
      return gap === undefined ? [] : [{ number: i + 1, index, gap }];
    }),
  };
}

export const SUBMISSION_ISSUE = {
  EMPTY: "empty",
  TOO_MANY: "too-many",
} as const;

export type SubmissionIssue = (typeof SUBMISSION_ISSUE)[keyof typeof SUBMISSION_ISSUE];

/**
 * Lo que impide corregir. Se valida ANTES: un hueco vacío o con dos
 * palabras no es un error de gramática, es una respuesta que el examen
 * ni siquiera lee. "don't" son dos palabras para Cambridge.
 */
export function findIssue(raw: string | undefined): SubmissionIssue | null {
  const clean = normalize(raw ?? "");
  if (clean === "") return SUBMISSION_ISSUE.EMPTY;
  if (countWords(clean) > WORDS_PER_GAP) return SUBMISSION_ISSUE.TOO_MANY;
  return null;
}

export function isCorrect(gap: TextGap, raw: string | undefined): boolean {
  return gap.answers.includes(normalize(raw ?? ""));
}

export interface Grade {
  correct: number;
  total: number;
}

export function grade(paper: Paper, answers: Readonly<Record<string, string>>): Grade {
  return {
    correct: paper.gaps.filter(({ gap }) => isCorrect(gap, answers[gap.id])).length,
    total: paper.gaps.length,
  };
}

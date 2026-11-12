import { drawGaps } from "../../exam/gappedText";
import { shuffle } from "../../lib/shuffle";
import { DISTRACTORS_SHOWN, type ClozeText, type TextGap } from "./types";

/**
 * Un "examen": un texto, con el ejemplo y ocho de sus huecos candidatos,
 * cada uno con sus cuatro opciones ya barajadas.
 *
 * Se arma una vez por intento y queda fijo: si se rearmara en cada render,
 * las opciones cambiarían de lugar mientras elegís.
 */

export interface PaperGap {
  /** 0 es el ejemplo; 1–8, los huecos a responder. */
  number: number;
  /** Posición del hueco en `text.gaps`: así lo ubica el texto. */
  index: number;
  gap: TextGap;
  options: readonly string[];
}

export interface Paper {
  text: ClozeText;
  example: PaperGap;
  gaps: readonly PaperGap[];
}

function optionsFor(gap: TextGap): readonly string[] {
  return shuffle([gap.answer, ...shuffle(gap.distractors).slice(0, DISTRACTORS_SHOWN)]);
}

/** Un texto al azar, distinto del anterior si hay de dónde elegir. */
export function pickText(texts: readonly ClozeText[], previousId?: string): ClozeText {
  const pool = texts.length > 1 ? texts.filter((text) => text.id !== previousId) : texts;
  const text = shuffle(pool)[0];
  if (text === undefined) throw new Error("[multiple-choice-cloze-exam] no hay textos");
  return text;
}

export function buildPaper(text: ClozeText): Paper {
  const example = text.gaps[0];
  if (example === undefined) throw new Error(`[multiple-choice-cloze-exam] "${text.id}" sin huecos`);

  return {
    text,
    example: { number: 0, index: 0, gap: example, options: optionsFor(example) },
    gaps: drawGaps(text.gaps.length).flatMap((index, i) => {
      const gap = text.gaps[index];
      return gap === undefined ? [] : [{ number: i + 1, index, gap, options: optionsFor(gap) }];
    }),
  };
}

export interface GapResult {
  paperGap: PaperGap;
  chosen: string | undefined;
  correct: boolean;
}

export interface Grade {
  correct: number;
  total: number;
  results: readonly GapResult[];
}

/** Un punto por hueco, como en el Part 1 real. Sin responder cuenta mal. */
export function grade(paper: Paper, answers: Readonly<Record<string, string>>): Grade {
  const results = paper.gaps.map((paperGap) => {
    const chosen = answers[paperGap.gap.id];
    return { paperGap, chosen, correct: chosen === paperGap.gap.answer };
  });

  return {
    correct: results.filter((result) => result.correct).length,
    total: results.length,
    results,
  };
}

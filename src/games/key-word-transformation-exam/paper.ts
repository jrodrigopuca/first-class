import { markAnswer, MARKS_PER_ITEM, type Marking } from "../../exam/keyWord";
import { shuffle } from "../../lib/shuffle";
import { ITEMS_PER_PAPER, type KeyWordItem } from "./types";

/**
 * Un intento: seis transformaciones al azar.
 *
 * Evita las del intento anterior mientras haya de dónde elegir: con 60
 * frases y 6 por vez, "Otra tanda" siempre trae seis nuevas.
 */
export function buildPaper(
  items: readonly KeyWordItem[],
  previous: readonly KeyWordItem[] = [],
): readonly KeyWordItem[] {
  const seen = new Set(previous.map((item) => item.id));
  const fresh = items.filter((item) => !seen.has(item.id));
  const pool = fresh.length >= ITEMS_PER_PAPER ? fresh : items;
  return shuffle(pool).slice(0, ITEMS_PER_PAPER);
}

export interface Grade {
  /** Puntos de examen: 0–2 por ítem. */
  marks: number;
  total: number;
  byId: ReadonlyMap<string, Marking>;
}

export function grade(paper: readonly KeyWordItem[], answers: Readonly<Record<string, string>>): Grade {
  const byId = new Map(paper.map((item) => [item.id, markAnswer(item.halves, answers[item.id] ?? "")]));
  return {
    marks: [...byId.values()].reduce((sum, marking) => sum + marking.marks, 0),
    total: paper.length * MARKS_PER_ITEM,
    byId,
  };
}

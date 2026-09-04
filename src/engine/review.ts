import type { ProgressMap, ReviewFamily } from "./types";

/**
 * Cuán flojo estás en cada familia, según lo que ya guardó el SRS.
 *
 * Puro: recibe el progreso, no lo lee del disco. Igual que leitner.ts.
 */

export interface FamilyStats {
  family: ReviewFamily;
  attempted: number;
  hits: number;
  /** 0–1. undefined si nunca la practicaste: no sabés que estás flojo, no sabés nada. */
  accuracy: number | undefined;
}

export function statsFor(family: ReviewFamily, progress: ProgressMap): FamilyStats {
  let attempted = 0;
  let hits = 0;

  for (const entry of family.entries) {
    const item = progress[entry.questionId];
    if (item === undefined) continue;
    attempted += item.attempts;
    hits += item.hits;
  }

  return {
    family,
    attempted,
    hits,
    accuracy: attempted === 0 ? undefined : hits / attempted,
  };
}

/**
 * Ordena por debilidad: primero lo que más fallás.
 *
 * Lo nunca practicado va al final, no al principio. No es debilidad
 * demostrada: es ausencia de datos, y mezclarlo con lo que sí fallás
 * te haría repasar lo que no necesitás.
 */
export function byWeakness(
  families: readonly ReviewFamily[],
  progress: ProgressMap,
): readonly FamilyStats[] {
  return families
    .map((family) => statsFor(family, progress))
    .sort((a, b) => {
      if (a.accuracy === undefined && b.accuracy === undefined) {
        return a.family.title.localeCompare(b.family.title);
      }
      if (a.accuracy === undefined) return 1;
      if (b.accuracy === undefined) return -1;
      if (a.accuracy !== b.accuracy) return a.accuracy - b.accuracy;
      return b.attempted - a.attempted;
    });
}

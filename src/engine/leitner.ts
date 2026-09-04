import type { ItemProgress, ProgressMap, Question } from "./types";
import { shuffle } from "../lib/shuffle";

/**
 * Repetición espaciada con el sistema Leitner (cajas).
 *
 * La idea, en una frase: cada ítem vive en una caja; acertarlo lo sube
 * una caja y lo aleja en el tiempo, fallarlo lo devuelve a la caja 1.
 * Así dejás de gastar sesiones en lo que ya sabés y te concentrás en
 * lo que estás por olvidar.
 *
 * Todo acá es PURO: recibe el tiempo como parámetro en vez de llamar a
 * Date.now(). Eso lo hace testeable — podés simular seis meses de
 * estudio en un test sin esperar seis meses.
 */

export const FIRST_BOX = 1;
export const LAST_BOX = 5;

const DAY_MS = 86_400_000;

/** Días hasta el próximo repaso según la caja. Caja 1 = vuelve enseguida. */
const INTERVAL_DAYS: Readonly<Record<number, number>> = {
  1: 0,
  2: 1,
  3: 3,
  4: 7,
  5: 16,
};

function intervalMs(box: number): number {
  return (INTERVAL_DAYS[box] ?? 0) * DAY_MS;
}

function clampBox(box: number): number {
  return Math.min(LAST_BOX, Math.max(FIRST_BOX, box));
}

/**
 * Transición tras responder. Es la regla entera del algoritmo.
 *
 * Fijate la asimetría: acertar sube UNA caja, fallar te manda de vuelta
 * a la primera. No es castigo — es que si lo olvidaste, el intervalo
 * largo que habías ganado resultó ser mentira.
 */
export function applyResult(
  previous: ItemProgress | undefined,
  correct: boolean,
  now: number,
): ItemProgress {
  const box = correct ? clampBox((previous?.box ?? FIRST_BOX) + 1) : FIRST_BOX;

  return {
    box,
    dueAt: now + intervalMs(box),
    lastSeenAt: now,
    attempts: (previous?.attempts ?? 0) + 1,
    hits: (previous?.hits ?? 0) + (correct ? 1 : 0),
  };
}

export function isDue(progress: ItemProgress | undefined, now: number): boolean {
  return progress === undefined || progress.dueAt <= now;
}

/** Ítem en la última caja: se sigue repasando, pero cada dos semanas y media. */
export function isMastered(progress: ItemProgress | undefined): boolean {
  return progress !== undefined && progress.box >= LAST_BOX;
}

const PRIORITY_OVERDUE = 0;
const PRIORITY_NEW = 1;
const PRIORITY_AHEAD = 2;

/**
 * Arma la ronda. Reemplaza al shuffle plano.
 *
 * Prioridad: primero lo VENCIDO (lo estás olvidando ahora mismo),
 * después lo que nunca viste, y solo si sobra lugar, lo que todavía no
 * toca — empezando por las cajas más bajas, o sea lo más flojo.
 *
 * Ese tercer escalón es lo que hace que nunca abras la app y no tengas
 * nada que hacer. Un SRS puro te dejaría con la pantalla vacía.
 */
export function selectRound<TQuestion extends Question>(
  questions: readonly TQuestion[],
  roundLength: number,
  progress: ProgressMap,
  now: number,
): TQuestion[] {
  const ranked = questions.map((question) => {
    const item = progress[question.id];

    if (item === undefined) {
      return { question, priority: PRIORITY_NEW, order: 0 };
    }
    if (item.dueAt <= now) {
      // Cuanto más vencido, más urgente.
      return { question, priority: PRIORITY_OVERDUE, order: item.dueAt };
    }
    // Todavía no toca: primero las cajas bajas (lo más flojo).
    return { question, priority: PRIORITY_AHEAD, order: item.box * DAY_MS + item.dueAt };
  });

  ranked.sort((a, b) => a.priority - b.priority || a.order - b.order);

  const selected = ranked
    .slice(0, Math.min(roundLength, ranked.length))
    .map((entry) => entry.question);

  // Se baraja DESPUÉS de elegir: los ítems son los correctos, pero el
  // orden no es predecible (si no, siempre empezarías por el más viejo).
  return shuffle(selected);
}

export interface ProgressSummary {
  total: number;
  unseen: number;
  learning: number;
  mastered: number;
  dueNow: number;
}

export function summarize<TQuestion extends Question>(
  questions: readonly TQuestion[],
  progress: ProgressMap,
  now: number,
): ProgressSummary {
  let unseen = 0;
  let learning = 0;
  let mastered = 0;
  let dueNow = 0;

  for (const question of questions) {
    const item = progress[question.id];
    if (item === undefined) {
      unseen += 1;
      dueNow += 1;
      continue;
    }
    if (isMastered(item)) mastered += 1;
    else learning += 1;
    if (item.dueAt <= now) dueNow += 1;
  }

  return { total: questions.length, unseen, learning, mastered, dueNow };
}

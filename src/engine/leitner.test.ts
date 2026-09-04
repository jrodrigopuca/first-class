import { describe, expect, it } from "vitest";
import {
  applyResult,
  FIRST_BOX,
  isDue,
  isMastered,
  LAST_BOX,
  selectRound,
  summarize,
} from "./leitner";
import type { ItemProgress, ProgressMap, Question } from "./types";

/*
 * Ni un solo mock de reloj acá. leitner.ts recibe `now` como parámetro,
 * así que simular seis meses de estudio es pasar un número distinto.
 * Ese diseño es lo que hace que estos tests sean rápidos y no floten.
 */

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 0, 15);

function progress(box: number, dueAt: number): ItemProgress {
  return { box, dueAt, lastSeenAt: NOW - DAY, attempts: 3, hits: 2 };
}

function question(id: string): Question {
  return { id, level: 1 };
}

describe("applyResult", () => {
  it("manda un ítem nuevo acertado a la caja 2, que vuelve en un día", () => {
    const result = applyResult(undefined, true, NOW);

    expect(result.box).toBe(2);
    expect(result.dueAt).toBe(NOW + DAY);
  });

  it("sube exactamente una caja por acierto", () => {
    const result = applyResult(progress(2, NOW), true, NOW);

    expect(result.box).toBe(3);
    expect(result.dueAt).toBe(NOW + 3 * DAY);
  });

  it("no pasa de la última caja por más que sigas acertando", () => {
    const result = applyResult(progress(LAST_BOX, NOW), true, NOW);

    expect(result.box).toBe(LAST_BOX);
    expect(result.dueAt).toBe(NOW + 16 * DAY);
  });

  it("devuelve a la primera caja al fallar, aunque estuviera dominado", () => {
    const result = applyResult(progress(LAST_BOX, NOW + 16 * DAY), false, NOW);

    expect(result.box).toBe(FIRST_BOX);
  });

  it("deja el ítem fallado vencido de inmediato, para que vuelva enseguida", () => {
    const result = applyResult(progress(4, NOW), false, NOW);

    expect(result.dueAt).toBe(NOW);
    expect(isDue(result, NOW)).toBe(true);
  });

  it("acumula intentos y aciertos a lo largo del tiempo", () => {
    const first = applyResult(undefined, true, NOW);
    const second = applyResult(first, false, NOW + DAY);
    const third = applyResult(second, true, NOW + 2 * DAY);

    expect(third.attempts).toBe(3);
    expect(third.hits).toBe(2);
  });
});

describe("isDue", () => {
  it("considera vencido lo que nunca se vio", () => {
    expect(isDue(undefined, NOW)).toBe(true);
  });

  it("vence exactamente en el instante de dueAt, no un milisegundo después", () => {
    const item = progress(3, NOW);

    expect(isDue(item, NOW - 1)).toBe(false);
    expect(isDue(item, NOW)).toBe(true);
  });
});

describe("isMastered", () => {
  it("solo cuenta como dominado el que llegó a la última caja", () => {
    expect(isMastered(progress(LAST_BOX - 1, NOW))).toBe(false);
    expect(isMastered(progress(LAST_BOX, NOW))).toBe(true);
  });

  it("no considera dominado lo que nunca se vio", () => {
    expect(isMastered(undefined)).toBe(false);
  });
});

describe("selectRound", () => {
  const questions = [
    question("vencidaHace9dias"),
    question("vencidaAyer"),
    question("sinVer"),
    question("vueveEnDosDias"),
    question("dominada"),
  ];

  const state: ProgressMap = {
    vencidaHace9dias: progress(2, NOW - 9 * DAY),
    vencidaAyer: progress(2, NOW - DAY),
    vueveEnDosDias: progress(3, NOW + 2 * DAY),
    dominada: progress(LAST_BOX, NOW + 16 * DAY),
  };

  const idsOf = (selected: readonly Question[]) => selected.map((q) => q.id).sort();

  it("elige lo vencido antes que lo que nunca se vio", () => {
    expect(idsOf(selectRound(questions, 2, state, NOW))).toEqual([
      "vencidaAyer",
      "vencidaHace9dias",
    ]);
  });

  it("elige lo que nunca se vio antes que lo que todavía no toca", () => {
    expect(idsOf(selectRound(questions, 3, state, NOW))).toContain("sinVer");
  });

  it("entre dos vencidos elige primero al más vencido", () => {
    expect(idsOf(selectRound(questions, 1, state, NOW))).toEqual(["vencidaHace9dias"]);
  });

  it("rellena con ítems que aún no tocan antes que devolver una ronda corta", () => {
    // Es la decisión de producto: nunca abrir la app y no tener nada
    // que hacer, aunque signifique repasar algo un poco antes de tiempo.
    expect(selectRound(questions, 5, state, NOW)).toHaveLength(5);
  });

  it("nunca devuelve más preguntas que el largo pedido", () => {
    expect(selectRound(questions, 2, state, NOW)).toHaveLength(2);
  });

  it("nunca repite una pregunta dentro de la misma ronda", () => {
    const ids = selectRound(questions, 5, state, NOW).map((q) => q.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("devuelve una ronda vacía si no hay preguntas", () => {
    expect(selectRound([], 10, {}, NOW)).toEqual([]);
  });

  it("no se pasa del pool disponible aunque le pidas más", () => {
    expect(selectRound(questions, 99, state, NOW)).toHaveLength(questions.length);
  });
});

describe("summarize", () => {
  it("separa sin ver, en progreso y dominadas", () => {
    const questions = [question("a"), question("b"), question("c")];
    const state: ProgressMap = {
      a: progress(LAST_BOX, NOW + 16 * DAY),
      b: progress(2, NOW + DAY),
    };

    expect(summarize(questions, state, NOW)).toEqual({
      total: 3,
      unseen: 1,
      learning: 1,
      mastered: 1,
      dueNow: 1,
    });
  });

  it("cuenta como pendiente de repaso todo lo que nunca se vio", () => {
    const questions = [question("a"), question("b")];

    expect(summarize(questions, {}, NOW).dueNow).toBe(2);
  });
});

import { describe, expect, it } from "vitest";
import { byWeakness, statsFor } from "./review";
import type { ItemProgress, ProgressMap, ReviewFamily } from "./types";

const NOW = Date.UTC(2026, 0, 15);

function item(attempts: number, hits: number): ItemProgress {
  return { box: 2, dueAt: NOW, lastSeenAt: NOW, attempts, hits };
}

function family(id: string, questionIds: readonly string[]): ReviewFamily {
  return {
    id,
    title: id,
    entries: questionIds.map((questionId) => ({
      questionId,
      prompt: "A ___ sentence.",
      answer: "word",
      explanation: "porque sí",
    })),
  };
}

describe("statsFor", () => {
  it("suma intentos y aciertos de todos los ítems de la familia", () => {
    const progress: ProgressMap = { a: item(4, 1), b: item(2, 2) };

    expect(statsFor(family("f", ["a", "b"]), progress)).toMatchObject({
      attempted: 6,
      hits: 3,
      accuracy: 0.5,
    });
  });

  it("ignora los ítems que todavía no se practicaron", () => {
    const progress: ProgressMap = { a: item(2, 1) };

    expect(statsFor(family("f", ["a", "sinPracticar"]), progress)).toMatchObject({
      attempted: 2,
      hits: 1,
    });
  });

  it("deja la precisión en undefined si nunca practicaste la familia", () => {
    // No es cero: cero significaría "fallás todo". Acá no hay dato.
    expect(statsFor(family("f", ["a"]), {}).accuracy).toBeUndefined();
  });
});

describe("byWeakness", () => {
  const progress: ProgressMap = {
    mal: item(10, 2),
    masOMenos: item(10, 7),
    bien: item(10, 10),
  };

  const families = [
    family("bien", ["bien"]),
    family("nuevaSinDatos", ["jamas"]),
    family("mal", ["mal"]),
    family("masOMenos", ["masOMenos"]),
  ];

  it("pone primero la familia que más fallás", () => {
    expect(byWeakness(families, progress).map((s) => s.family.id)).toEqual([
      "mal",
      "masOMenos",
      "bien",
      "nuevaSinDatos",
    ]);
  });

  it("manda al final lo que nunca practicaste, no al principio", () => {
    // Ausencia de datos no es debilidad demostrada. Mezclarlas te haría
    // repasar lo que no necesitás.
    const order = byWeakness(families, progress).map((s) => s.family.id);

    expect(order.at(-1)).toBe("nuevaSinDatos");
  });

  it("no pierde ninguna familia por el camino", () => {
    expect(byWeakness(families, progress)).toHaveLength(families.length);
  });

  it("con progreso vacío devuelve todo ordenado alfabéticamente", () => {
    expect(byWeakness(families, {}).map((s) => s.family.id)).toEqual([
      "bien",
      "mal",
      "masOMenos",
      "nuevaSinDatos",
    ]);
  });
});

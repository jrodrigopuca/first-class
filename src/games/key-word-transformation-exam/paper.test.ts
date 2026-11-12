import { describe, expect, it } from "vitest";
import { buildPaper, grade } from "./paper";
import { ITEMS } from "./questions";
import { ITEMS_PER_PAPER } from "./types";

describe("buildPaper", () => {
  it("trae seis frases distintas", () => {
    const paper = buildPaper(ITEMS);
    expect(paper).toHaveLength(ITEMS_PER_PAPER);
    expect(new Set(paper.map((item) => item.id)).size).toBe(ITEMS_PER_PAPER);
  });

  it("no repite ninguna frase del intento anterior", () => {
    for (let i = 0; i < 50; i++) {
      const previous = buildPaper(ITEMS);
      const next = buildPaper(ITEMS, previous);
      const before = new Set(previous.map((item) => item.id));
      expect(next.some((item) => before.has(item.id))).toBe(false);
    }
  });
});

describe("grade", () => {
  it("suma 0–2 por frase, sobre 12", () => {
    const paper = buildPaper(ITEMS);
    const [first, second, ...rest] = paper;
    if (first === undefined || second === undefined) throw new Error("hoja vacía");

    const answers: Record<string, string> = {};
    for (const item of rest) answers[item.id] = item.answers[0] ?? "";
    const [half] = first.halves;
    answers[first.id] = `${half?.[0] ?? ""} zzz`; // solo la primera mitad
    answers[second.id] = "zzz zzz"; // nada

    const result = grade(paper, answers);
    expect(result.total).toBe(12);
    expect(result.marks).toBe(rest.length * 2 + 1);
    expect(result.byId.get(first.id)?.marks).toBe(1);
    expect(result.byId.get(second.id)?.marks).toBe(0);
  });
});

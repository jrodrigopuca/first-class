import { describe, expect, it } from "vitest";
import { parseItem, ITEMS, type RawItem } from "./questions";
import { TRANSFORMATION } from "./types";

const VALID: RawItem = {
  id: "sample",
  category: "passive",
  label: "label",
  level: 1,
  original: "People say that he is rich.",
  keyWord: "SAID",
  gapped: "He ___ rich.",
  answers: ["is said | to be"],
  explanation: "explanation",
};

describe("parseItem", () => {
  it("acepta un ítem bien formado y separa las mitades", () => {
    const item = parseItem(VALID);
    expect(item.answers).toEqual(["is said to be"]);
    expect(item.halves).toEqual([["is said", "to be"]]);
  });

  it("rechaza una respuesta sin las mitades marcadas", () => {
    expect(() => parseItem({ ...VALID, answers: ["is said to be"] })).toThrow(/dos mitades/);
  });

  it("rechaza la palabra clave fuera del hueco", () => {
    expect(() => parseItem({ ...VALID, answers: ["is | believed to be"] })).toThrow(/no contiene la palabra clave/);
  });

  it("rechaza más de cinco palabras contando como Cambridge", () => {
    expect(() => parseItem({ ...VALID, answers: ["is often | said to be"], gapped: "He ___ rich." })).not.toThrow();
    expect(() => parseItem({ ...VALID, answers: ["isn't really | said to be"] })).toThrow(/6 palabras/);
  });

  it("rechaza un hueco que abre la frase o una frase con dos huecos", () => {
    expect(() => parseItem({ ...VALID, gapped: "___ rich." })).toThrow(/abrir la frase/);
    expect(() => parseItem({ ...VALID, gapped: "He ___ rich ___." })).toThrow(/exactamente un/);
  });
});

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(ITEMS.length).toBeGreaterThanOrEqual(60);
  });

  it("cubre todos los tipos de transformación", () => {
    for (const type of Object.values(TRANSFORMATION)) {
      expect(ITEMS.some((item) => item.category === type), `"${type}" quedó sin ítems`).toBe(true);
    }
  });

  it("reutiliza palabras clave en estructuras distintas", () => {
    // Mismo invariante que la pre-práctica: si cada clave apareciera en un
    // solo tipo de transformación, verla alcanzaría para saber la estructura.
    const categoriesByKey = new Map<string, Set<string>>();
    for (const item of ITEMS) {
      categoriesByKey.set(item.keyWord, (categoriesByKey.get(item.keyWord) ?? new Set()).add(item.category));
    }
    const shared = [...categoriesByKey.values()].filter((categories) => categories.size > 1).length;
    expect(shared).toBeGreaterThanOrEqual(2);
  });
});

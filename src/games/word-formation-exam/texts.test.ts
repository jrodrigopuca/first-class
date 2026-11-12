import { describe, expect, it } from "vitest";
import { parseText, TEXTS, type RawText } from "./texts";
import { MIN_CANDIDATES, ROOT_REUSE_FLOOR, WORD_CATEGORY } from "./types";

const WORDS = ["taken", ..."abcdefghij".split("").map((c) => `w${c}`)];

const VALID: RawText = {
  id: "sample",
  title: "Sample",
  level: 1,
  paragraphs: [
    "She has {taken} up tennis. " +
      WORDS.slice(1)
        .map((word) => `Then the group met again and {${word}} on.`)
        .join(" "),
  ],
  gaps: WORDS.map((word) => ({
    root: "ROOT",
    answers: [word],
    category: "noun",
    label: "label",
    explanation: "explanation",
  })),
};

function withGap(index: number, patch: Partial<RawText["gaps"][number]>): RawText {
  return { ...VALID, gaps: VALID.gaps.map((gap, i) => (i === index ? { ...gap, ...patch } : gap)) };
}

describe("parseText", () => {
  it("acepta un texto bien formado", () => {
    expect(parseText(VALID).gaps).toHaveLength(MIN_CANDIDATES + 1);
  });

  it("propaga los errores de forma del texto con el id del juego", () => {
    const [first = ""] = VALID.paragraphs;
    expect(() => parseText({ ...VALID, paragraphs: [first.replace("She has {taken}", "{taken}")] })).toThrow(
      /\[word-formation-exam\] "sample": el hueco \{taken\} abre una frase/,
    );
  });

  it("rechaza la lista desfasada respecto del texto", () => {
    const [a, b, ...rest] = VALID.gaps;
    if (a === undefined || b === undefined) throw new Error("fixture rota");
    expect(() => parseText({ ...VALID, gaps: [b, a, ...rest] })).toThrow(/se desfasó/);
  });

  it("rechaza una respuesta que es la raíz sin transformar", () => {
    expect(() => parseText(withGap(1, { root: "WA" }))).toThrow(/sin transformar/);
  });

  it("rechaza una raíz que no está en mayúsculas", () => {
    expect(() => parseText(withGap(1, { root: "Create" }))).toThrow(/MAYÚSCULAS/);
  });

  it("rechaza una respuesta de más de una palabra", () => {
    expect(() => parseText(withGap(1, { answers: ["wa", "more useful"] }))).toThrow(/una sola palabra/);
  });
});

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(TEXTS.length).toBeGreaterThan(0);
  });

  it("cubre los tipos de transformación que usa", () => {
    const gaps = TEXTS.flatMap((text) => text.gaps);
    // VERB queda afuera a propósito: en texto continuo casi no aparece.
    for (const type of Object.values(WORD_CATEGORY).filter((t) => t !== WORD_CATEGORY.VERB)) {
      expect(gaps.some((gap) => gap.category === type), `"${type}" quedó sin huecos`).toBe(true);
    }
  });

  it(`al menos el ${ROOT_REUSE_FLOOR * 100}% de los huecos tiene una raíz que pide otra forma en otro hueco`, () => {
    // Si falla: sumá huecos con raíces que YA existen, pidiendo otra forma.
    // No bajes el umbral: una raíz con una sola respuesta se memoriza.
    const gaps = TEXTS.flatMap((text) => text.gaps);
    const forms = new Map<string, Set<string>>();
    for (const gap of gaps) {
      forms.set(gap.root, (forms.get(gap.root) ?? new Set()).add(gap.answers[0] ?? ""));
    }
    const reused = gaps.filter((gap) => (forms.get(gap.root)?.size ?? 0) > 1).length;

    expect(reused / gaps.length).toBeGreaterThanOrEqual(ROOT_REUSE_FLOOR);
  });
});

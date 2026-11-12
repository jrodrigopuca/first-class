import { describe, expect, it } from "vitest";
import { parseText, TEXTS, type RawText } from "./texts";
import { GAP_TYPE, MIN_CANDIDATES } from "./types";

const WORDS = ["take", ..."abcdefghij".split("").map((c) => `w${c}`)];

const VALID: RawText = {
  id: "sample",
  title: "Sample",
  level: 1,
  paragraphs: [
    "She decided to {take} up tennis. " +
      WORDS.slice(1)
        .map((word) => `Then the group met again and {${word}} on.`)
        .join(" "),
  ],
  gaps: WORDS.map((word) => ({
    answers: [word],
    category: "preposition",
    label: "label",
    explanation: "explanation",
  })),
};

function withAnswers(index: number, answers: string[]): RawText {
  return { ...VALID, gaps: VALID.gaps.map((gap, i) => (i === index ? { ...gap, answers } : gap)) };
}

describe("parseText", () => {
  it("acepta un texto bien formado", () => {
    expect(parseText(VALID).gaps).toHaveLength(MIN_CANDIDATES + 1);
  });

  it("propaga los errores de forma del texto con el id del juego", () => {
    const [first = ""] = VALID.paragraphs;
    expect(() => parseText({ ...VALID, paragraphs: [first.replace("She decided to {take}", "{take}")] })).toThrow(
      /\[open-cloze-exam\] "sample": el hueco \{take\} abre una frase/,
    );
  });

  it("rechaza la lista desfasada respecto del texto", () => {
    const [a, b, ...rest] = VALID.gaps;
    if (a === undefined || b === undefined) throw new Error("fixture rota");
    expect(() => parseText({ ...VALID, gaps: [b, a, ...rest] })).toThrow(/se desfasó/);
  });

  it("rechaza una respuesta aceptada de dos palabras según Cambridge", () => {
    // "don't" se ve como una palabra; para el examen son do + not.
    expect(() => parseText(withAnswers(1, ["wa", "don't"]))).toThrow(/2 palabras según Cambridge/);
  });

  it("rechaza una respuesta sin normalizar", () => {
    expect(() => parseText(withAnswers(1, ["wa", "In"]))).toThrow(/no está normalizada/);
  });

  it("rechaza un texto con menos candidatos que el mínimo", () => {
    const [first = ""] = VALID.paragraphs;
    const shorter = first.replace(" Then the group met again and {wj} on.", "");
    expect(() => parseText({ ...VALID, paragraphs: [shorter], gaps: VALID.gaps.slice(0, -1) })).toThrow(
      /candidatos/,
    );
  });
});

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(TEXTS.length).toBeGreaterThan(0);
  });

  it("cubre todos los tipos de hueco", () => {
    const gaps = TEXTS.flatMap((text) => text.gaps);
    for (const type of Object.values(GAP_TYPE)) {
      expect(gaps.some((gap) => gap.category === type), `"${type}" quedó sin huecos`).toBe(true);
    }
  });
});

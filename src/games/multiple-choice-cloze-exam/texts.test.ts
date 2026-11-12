import { describe, expect, it } from "vitest";
import { buildReview } from "./review";
import { parseText, sentenceAround, TEXTS, type RawText } from "./texts";
import { CLOZE_TYPE, MIN_CANDIDATES } from "./types";

const VALID: RawText = {
  id: "sample",
  title: "Sample",
  level: 1,
  paragraphs: [
    "She decided to {take} up tennis. " +
      Array.from({ length: 10 }, (_, i) => `Then the group met again and {w${"abcdefghij"[i]}} on.`).join(" "),
  ],
  gaps: ["take", ..."abcdefghij".split("").map((c) => `w${c}`)].map((answer) => ({
    answer,
    distractors: ["xa", "xb", "xc"],
    category: "collocation",
    label: "label",
    explanation: "explanation",
  })),
};

function withParagraph(paragraph: string): RawText {
  return { ...VALID, paragraphs: [paragraph] };
}

describe("parseText", () => {
  it("acepta un texto bien formado", () => {
    const text = parseText(VALID);
    expect(text.gaps).toHaveLength(MIN_CANDIDATES + 1);
    expect(text.gaps[0]?.id).toBe("sample-take");
  });




  it("propaga los errores de forma del texto con el id del juego", () => {
    const [first = ""] = VALID.paragraphs;
    expect(() => parseText(withParagraph(first.replace("She decided to {take}", "{take}")))).toThrow(
      /\[multiple-choice-cloze-exam\] "sample": el hueco \{take\} abre una frase/,
    );
  });

  it("rechaza la lista desfasada respecto del texto", () => {
    const [a, b, ...rest] = VALID.gaps;
    if (a === undefined || b === undefined) throw new Error("fixture rota");
    expect(() => parseText({ ...VALID, gaps: [b, a, ...rest] })).toThrow(/se desfasó/);
  });

  it("rechaza un texto con menos candidatos que el mínimo", () => {
    const [first = ""] = VALID.paragraphs;
    const shorter = first.replace(/ Then the group met again and \{wj\} on\./, "");
    expect(() => parseText({ ...withParagraph(shorter), gaps: VALID.gaps.slice(0, -1) })).toThrow(
      /candidatos/,
    );
  });

  it("rechaza un distractor igual a la respuesta", () => {
    const gaps = VALID.gaps.map((gap, i) =>
      i === 1 ? { ...gap, distractors: [gap.answer, "xb", "xc"] } : gap,
    );
    expect(() => parseText({ ...VALID, gaps })).toThrow(/opciones repetidas/);
  });
});

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(TEXTS.length).toBeGreaterThan(0);
  });

  it("cubre todos los tipos de hueco", () => {
    const gaps = TEXTS.flatMap((text) => text.gaps);
    for (const type of Object.values(CLOZE_TYPE)) {
      expect(
        gaps.some((gap) => gap.category === type),
        `"${type}" quedó sin huecos`,
      ).toBe(true);
    }
  });

  it("ninguna respuesta es 'siempre la buena'", () => {
    // Mismo invariante que la pre-práctica del Part 1: si una palabra solo
    // aparece como respuesta, verla entre las opciones ya te dice cuál es.
    // Si falla, sumá esas respuestas como distractores en otros huecos.
    // No bajes el umbral.
    const gaps = TEXTS.flatMap((text) => text.gaps);
    const answers = new Set(gaps.map((gap) => gap.answer));
    const asDistractor = new Set(gaps.flatMap((gap) => gap.distractors));
    const reused = [...answers].filter((answer) => asDistractor.has(answer));

    expect(reused.length / answers.size).toBeGreaterThanOrEqual(0.4);
  });

  it("el repaso tiene una frase con hueco por cada hueco del dataset", () => {
    const entries = buildReview().flatMap((family) => family.entries);
    const total = TEXTS.reduce((sum, text) => sum + text.gaps.length, 0);

    expect(entries).toHaveLength(total);
    for (const entry of entries) {
      expect(entry.prompt.split("___"), entry.questionId).toHaveLength(2);
    }
  });
});

describe("sentenceAround", () => {
  it("devuelve solo la frase del hueco, con los demás resueltos", () => {
    const text = parseText(VALID);
    expect(sentenceAround(text, 0)).toBe("She decided to ___ up tennis.");
    expect(sentenceAround(text, 1)).toBe("Then the group met again and ___ on.");
  });
});

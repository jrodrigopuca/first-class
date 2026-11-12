import { describe, expect, it } from "vitest";
import { buildPaper, grade, pickText } from "./paper";
import { TEXTS } from "./texts";
import { GAPS_PER_TEXT as GAPS_PER_PAPER } from "../../exam/gappedText";
import { DISTRACTORS_SHOWN } from "./types";

const TIMES = 50;

function firstText() {
  const text = TEXTS[0];
  if (text === undefined) throw new Error("dataset vacío");
  return text;
}

describe("buildPaper", () => {
  it("trae ocho huecos numerados en orden de lectura, sin el ejemplo", () => {
    for (const text of TEXTS) {
      const paper = buildPaper(text);
      const indexes = paper.gaps.map((g) => g.index);

      expect(paper.gaps, text.id).toHaveLength(GAPS_PER_PAPER);
      expect(paper.gaps.map((g) => g.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(indexes, text.id).toEqual([...indexes].sort((a, b) => a - b));
      expect(new Set(indexes).size).toBe(GAPS_PER_PAPER);
      expect(indexes).not.toContain(0);
      expect(paper.example.index).toBe(0);
    }
  });

  it("da cuatro opciones distintas, con la respuesta y distractores del hueco", () => {
    for (const text of TEXTS) {
      for (const { gap, options } of [buildPaper(text).example, ...buildPaper(text).gaps]) {
        expect(options, gap.id).toHaveLength(DISTRACTORS_SHOWN + 1);
        expect(new Set(options).size, gap.id).toBe(options.length);
        expect(options, gap.id).toContain(gap.answer);
        for (const option of options) {
          if (option !== gap.answer) expect(gap.distractors, gap.id).toContain(option);
        }
      }
    }
  });

  it("no elige siempre los mismos huecos", () => {
    const text = firstText();
    const selections = new Set(
      Array.from({ length: TIMES }, () =>
        buildPaper(text)
          .gaps.map((g) => g.index)
          .join(","),
      ),
    );
    expect(selections.size).toBeGreaterThan(1);
  });

  it("rota los distractores cuando el hueco tiene más de tres", () => {
    const text = firstText();
    const gap = text.gaps.find((g) => g.distractors.length > DISTRACTORS_SHOWN);
    if (gap === undefined) throw new Error("ningún hueco con distractores de sobra");

    const seen = new Set<string>();
    for (let i = 0; i < TIMES; i++) {
      const paperGap = buildPaper(text).gaps.find((g) => g.gap.id === gap.id);
      paperGap?.options.forEach((option) => seen.add(option));
    }
    expect(seen.size).toBe(gap.distractors.length + 1);
  });
});

describe("pickText", () => {
  it("no repite el texto anterior", () => {
    const previous = firstText();
    for (let i = 0; i < TIMES; i++) {
      expect(pickText(TEXTS, previous.id).id).not.toBe(previous.id);
    }
  });
});

describe("grade", () => {
  it("cuenta un punto por acierto y el hueco sin responder como error", () => {
    const paper = buildPaper(firstText());
    const [first, second] = paper.gaps;
    if (first === undefined || second === undefined) throw new Error("examen vacío");

    const answers = Object.fromEntries(paper.gaps.map((g) => [g.gap.id, g.gap.answer]));
    const wrong = second.options.find((option) => option !== second.gap.answer) ?? "";
    answers[second.gap.id] = wrong;
    delete answers[first.gap.id];

    const result = grade(paper, answers);
    expect(result.total).toBe(GAPS_PER_PAPER);
    expect(result.correct).toBe(GAPS_PER_PAPER - 2);
    expect(result.results[0]?.chosen).toBeUndefined();
  });
});

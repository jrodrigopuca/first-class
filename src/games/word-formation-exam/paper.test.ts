import { describe, expect, it } from "vitest";
import { GAPS_PER_TEXT } from "../../exam/gappedText";
import { buildPaper, findIssue, grade, isCorrect, SUBMISSION_ISSUE } from "./paper";
import { TEXTS } from "./texts";

function firstText() {
  const text = TEXTS[0];
  if (text === undefined) throw new Error("dataset vacío");
  return text;
}

function firstGap() {
  const gap = firstText().gaps[1];
  if (gap === undefined) throw new Error("texto sin huecos");
  return gap;
}

describe("buildPaper", () => {
  it("trae ocho huecos numerados en orden de lectura, sin el ejemplo", () => {
    for (const text of TEXTS) {
      const paper = buildPaper(text);
      const indexes = paper.gaps.map((g) => g.index);
      expect(paper.gaps, text.id).toHaveLength(GAPS_PER_TEXT);
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
      expect(indexes).not.toContain(0);
    }
  });
});

describe("findIssue", () => {
  it("frena el hueco vacío, el de dos palabras y la raíz copiada", () => {
    const gap = firstGap();
    expect(findIssue(gap, "")).toBe(SUBMISSION_ISSUE.EMPTY);
    expect(findIssue(gap, "very useful")).toBe(SUBMISSION_ISSUE.TOO_MANY);
    expect(findIssue(gap, gap.root)).toBe(SUBMISSION_ISSUE.UNCHANGED);
    expect(findIssue(gap, gap.root.toLowerCase())).toBe(SUBMISSION_ISSUE.UNCHANGED);
  });

  it("una forma mal escrita SÍ llega a corregirse: es un error de verdad", () => {
    expect(findIssue(firstGap(), "interviwer")).toBeNull();
  });
});

describe("isCorrect", () => {
  it("acepta todas las grafías, sin importar mayúsculas", () => {
    const gap = TEXTS.flatMap((t) => t.gaps).find((g) => g.answers.length > 1);
    if (gap === undefined) throw new Error("ningún hueco con varias grafías");
    for (const answer of gap.answers) expect(isCorrect(gap, answer.toUpperCase())).toBe(true);
  });
});

describe("grade", () => {
  it("cuenta un punto por hueco correcto", () => {
    const paper = buildPaper(firstText());
    const answers = Object.fromEntries(paper.gaps.map(({ gap }) => [gap.id, gap.answers[0] ?? ""]));
    const [first] = paper.gaps;
    if (first === undefined) throw new Error("examen vacío");
    answers[first.gap.id] = "zzz";
    expect(grade(paper, answers)).toEqual({ correct: GAPS_PER_TEXT - 1, total: GAPS_PER_TEXT });
  });
});

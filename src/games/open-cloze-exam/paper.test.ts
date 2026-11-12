import { describe, expect, it } from "vitest";
import { GAPS_PER_TEXT } from "../../exam/gappedText";
import { buildPaper, findIssue, grade, isCorrect, pickText, SUBMISSION_ISSUE } from "./paper";
import { TEXTS } from "./texts";

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
      expect(paper.gaps, text.id).toHaveLength(GAPS_PER_TEXT);
      expect(paper.gaps.map((g) => g.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
      expect(indexes).not.toContain(0);
    }
  });
});

describe("pickText", () => {
  it("no repite el texto anterior", () => {
    const previous = firstText();
    for (let i = 0; i < 50; i++) expect(pickText(TEXTS, previous.id).id).not.toBe(previous.id);
  });
});

describe("findIssue", () => {
  it("frena el hueco vacío y el de más de una palabra", () => {
    expect(findIssue(undefined)).toBe(SUBMISSION_ISSUE.EMPTY);
    expect(findIssue("   ")).toBe(SUBMISSION_ISSUE.EMPTY);
    expect(findIssue("in the")).toBe(SUBMISSION_ISSUE.TOO_MANY);
  });

  it("cuenta las contracciones como dos palabras, como Cambridge", () => {
    expect(findIssue("don't")).toBe(SUBMISSION_ISSUE.TOO_MANY);
  });

  it("deja pasar una palabra con mayúsculas o espacios alrededor", () => {
    expect(findIssue("  Since ")).toBeNull();
  });
});

describe("isCorrect", () => {
  it("acepta cualquiera de las respuestas válidas, sin importar mayúsculas", () => {
    const gap = TEXTS.flatMap((t) => t.gaps).find((g) => g.answers.length > 1);
    if (gap === undefined) throw new Error("ningún hueco con varias respuestas");
    for (const answer of gap.answers) expect(isCorrect(gap, ` ${answer.toUpperCase()} `)).toBe(true);
    expect(isCorrect(gap, "zzz")).toBe(false);
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

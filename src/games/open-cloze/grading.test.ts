import { describe, expect, it } from "vitest";
import { findSubmissionIssue, isCorrect, SUBMISSION_ISSUE } from "./grading";
import type { OpenClozeQuestion } from "./types";

const question: OpenClozeQuestion = {
  id: "linker-although-although",
  family: "linker-although",
  category: "linker",
  label: "although / though",
  level: 1,
  sentence: "He plays like a professional ___ he is only fourteen years old.",
  answers: ["although", "though"],
  explanation: "",
};

describe("findSubmissionIssue", () => {
  it("acepta una sola palabra", () => {
    expect(findSubmissionIssue("although")).toBeNull();
  });

  it("acepta una palabra con espacios de más alrededor", () => {
    expect(findSubmissionIssue("  although  ")).toBeNull();
  });

  it("rechaza una respuesta vacía", () => {
    expect(findSubmissionIssue("   ")).toBe(SUBMISSION_ISSUE.EMPTY);
  });

  it("rechaza dos palabras", () => {
    expect(findSubmissionIssue("in spite")).toBe(SUBMISSION_ISSUE.TOO_MANY);
  });

  it("rechaza una contracción, que cuenta como dos palabras", () => {
    // Se ve como una sola palabra y el examen la rechaza. Sin el conteo
    // de Cambridge la aceptaríamos y le enseñaríamos algo falso.
    expect(findSubmissionIssue("don't")).toBe(SUBMISSION_ISSUE.TOO_MANY);
    expect(findSubmissionIssue("cannot")).toBe(SUBMISSION_ISSUE.TOO_MANY);
  });
});

describe("isCorrect", () => {
  it("acepta cualquiera de las respuestas válidas", () => {
    expect(isCorrect(question, "although")).toBe(true);
    expect(isCorrect(question, "though")).toBe(true);
  });

  it("no le importan las mayúsculas", () => {
    expect(isCorrect(question, "Although")).toBe(true);
  });

  it("rechaza una palabra que no está en la lista", () => {
    expect(isCorrect(question, "despite")).toBe(false);
  });
});

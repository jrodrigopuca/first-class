import { describe, expect, it } from "vitest";
import { countWords } from "../../exam/text";
import { QUESTIONS } from "./questions";
import { GAP_TYPE, WORDS_PER_GAP } from "./types";

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  it("tiene todos los tipos de hueco con al menos una pregunta", () => {
    for (const type of Object.values(GAP_TYPE)) {
      const count = QUESTIONS.filter((q) => q.category === type).length;
      expect(count, `"${type}" quedó sin preguntas`).toBeGreaterThan(0);
    }
  });

  it("ninguna frase abre con el hueco", () => {
    for (const question of QUESTIONS) {
      expect(question.sentence.trimStart().startsWith("___"), question.id).toBe(false);
    }
  });
});

describe("regla del examen: una sola palabra", () => {
  it("todas las respuestas son exactamente una palabra según Cambridge", () => {
    for (const question of QUESTIONS) {
      for (const answer of question.answers) {
        expect(countWords(answer), `"${answer}" (${question.id})`).toBe(WORDS_PER_GAP);
      }
    }
  });

  it("ninguna respuesta es una contracción", () => {
    for (const question of QUESTIONS) {
      for (const answer of question.answers) {
        expect(answer.includes("'"), `${question.id}: "${answer}"`).toBe(false);
      }
    }
  });
});

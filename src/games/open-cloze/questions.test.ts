import { buildReview } from "./review";
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

describe("material de repaso", () => {
  const families = buildReview();

  it("agrupa todas las preguntas sin perder ninguna", () => {
    const entries = families.flatMap((f) => f.entries);

    expect(entries).toHaveLength(QUESTIONS.length);
  });

  it("usa los MISMOS ids que la repetición espaciada", () => {
    /*
     * Este es el invariante silencioso del repaso: si un questionId no
     * coincidiera con el de la pregunta, la familia mostraría "sin datos"
     * para siempre y nadie se enteraría. No crashea, no lintea mal: solo
     * miente.
     */
    const real = new Set(QUESTIONS.map((q) => q.id));

    for (const family of families) {
      for (const entry of family.entries) {
        expect(real.has(entry.questionId), `id fantasma: ${entry.questionId}`).toBe(true);
      }
    }
  });

  it("no deja familias vacías ni explicaciones en blanco", () => {
    for (const family of families) {
      expect(family.entries.length, family.id).toBeGreaterThan(0);
      for (const entry of family.entries) {
        expect(entry.explanation.trim(), entry.questionId).not.toBe("");
        expect(entry.answer.trim(), entry.questionId).not.toBe("");
        expect(entry.prompt, entry.questionId).toContain("___");
      }
    }
  });
});

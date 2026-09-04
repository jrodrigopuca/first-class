import { buildReview } from "./review";
import { describe, expect, it } from "vitest";
import { countWords } from "./grading";
import { QUESTIONS } from "./questions";
import { MAX_WORDS, MIN_WORDS, TRANSFORMATION } from "./types";

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  it("tiene todos los tipos de transformación con al menos un ítem", () => {
    for (const transformation of Object.values(TRANSFORMATION)) {
      const count = QUESTIONS.filter((q) => q.category === transformation).length;
      expect(count, `"${transformation}" quedó sin ítems`).toBeGreaterThan(0);
    }
  });
});

describe("reglas del examen", () => {
  it("todas las respuestas entran en 2 a 5 palabras, contando como Cambridge", () => {
    for (const question of QUESTIONS) {
      for (const answer of question.answers) {
        const words = countWords(answer);
        expect(
          words,
          `"${answer}" (${question.id}) tiene ${words} palabras`,
        ).toBeGreaterThanOrEqual(MIN_WORDS);
        expect(words).toBeLessThanOrEqual(MAX_WORDS);
      }
    }
  });

  it("todas las respuestas contienen la palabra clave sin modificarla", () => {
    // Este es el error más traicionero al escribir contenido: la frase se
    // lee perfecta y el ítem es inválido porque la clave quedó FUERA del
    // hueco. Ya pasó una vez.
    for (const question of QUESTIONS) {
      for (const answer of question.answers) {
        expect(
          answer.split(" "),
          `"${answer}" (${question.id}) no contiene ${question.keyWord}`,
        ).toContain(question.keyWord.toLowerCase());
      }
    }
  });
});

describe("invariante pedagógico: la clave no puede ser una clave de diccionario", () => {
  it("reutiliza palabras clave en estructuras distintas", () => {
    const perKeyWord = new Map<string, Set<string>>();
    for (const question of QUESTIONS) {
      const families = perKeyWord.get(question.keyWord) ?? new Set();
      families.add(question.family);
      perKeyWord.set(question.keyWord, families);
    }

    const reused = [...perKeyWord.values()].filter((families) => families.size > 1);

    expect(
      reused.length,
      "ninguna palabra clave aparece en dos estructuras distintas: se puede memorizar clave → respuesta",
    ).toBeGreaterThan(0);
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

import { buildReview } from "./review";
import { describe, expect, it } from "vitest";
import { buildOptions, isCorrect } from "./options";
import { QUESTIONS } from "./questions";
import { CLOZE_TYPE, OPTION_COUNT } from "./types";

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  it("tiene todos los tipos con al menos una pregunta", () => {
    for (const type of Object.values(CLOZE_TYPE)) {
      const count = QUESTIONS.filter((q) => q.category === type).length;
      expect(count, `"${type}" quedó sin preguntas`).toBeGreaterThan(0);
    }
  });

  it("ninguna frase abre con el hueco", () => {
    // Si el hueco abriera la frase, la opción correcta iría en mayúscula
    // y las otras tres no: la mayúscula sería la respuesta.
    for (const question of QUESTIONS) {
      expect(question.sentence.trimStart().startsWith("___"), question.id).toBe(false);
    }
  });
});

describe("buildOptions", () => {
  it("devuelve siempre cuatro opciones distintas", () => {
    for (const question of QUESTIONS) {
      const options = buildOptions(question);

      expect(options, question.id).toHaveLength(OPTION_COUNT);
      expect(new Set(options).size, question.id).toBe(OPTION_COUNT);
    }
  });

  it("incluye siempre la respuesta correcta", () => {
    for (const question of QUESTIONS) {
      expect(buildOptions(question), question.id).toContain(question.answer);
    }
  });

  it("no deja la correcta siempre en el mismo lugar", () => {
    // Si la posición fuera fija, memorizarías "la B" en vez del vocabulario.
    const question = QUESTIONS[0];
    if (question === undefined) throw new Error("dataset vacío");

    const positions = new Set(
      Array.from({ length: 60 }, () => buildOptions(question).indexOf(question.answer)),
    );

    expect(positions.size).toBeGreaterThan(1);
  });
});

describe("isCorrect", () => {
  it("acepta la respuesta y rechaza cada distractor", () => {
    for (const question of QUESTIONS) {
      expect(isCorrect(question, question.answer), question.id).toBe(true);
      for (const distractor of question.distractors) {
        expect(isCorrect(question, distractor), `${question.id} / ${distractor}`).toBe(false);
      }
    }
  });
});

describe("invariante pedagógico: ninguna palabra es 'siempre la correcta'", () => {
  it("reutiliza palabras como respuesta en un ítem y distractor en otro", () => {
    /*
     * Si una palabra apareciera SIEMPRE como correcta, el jugador
     * aprendería a reconocerla en vez de aprender la colocación. Es el
     * equivalente en Part 1 al mapeo 1:1 raíz→respuesta del Part 3.
     */
    const asAnswer = new Set(QUESTIONS.map((q) => q.answer));
    const asDistractor = new Set(QUESTIONS.flatMap((q) => q.distractors));
    const inBoth = [...asAnswer].filter((word) => asDistractor.has(word));

    const ratio = inBoth.length / asAnswer.size;

    expect(
      ratio,
      `solo ${Math.round(ratio * 100)}% de las respuestas aparece también como distractor: reutilizá vocabulario entre ítems`,
    ).toBeGreaterThanOrEqual(0.4);
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

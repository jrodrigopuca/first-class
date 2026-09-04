import { buildReview } from "./review";
import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./questions";
import { WORD_CATEGORY } from "./types";

/*
 * El solo hecho de importar QUESTIONS corre toda la validación del
 * dataset: ids, categorías, huecos, respuestas normalizadas y ambigüedad
 * dentro de una familia. Si algo está mal, este archivo ni siquiera carga.
 *
 * Eso convierte en chequeo de CI lo que antes solo reventaba en el
 * navegador, y solo si recargabas entero (el HMR no lo disparaba).
 */

describe("dataset", () => {
  it("carga entero sin fallar ninguna validación", () => {
    expect(QUESTIONS.length).toBeGreaterThan(0);
  });

  it("tiene todas las categorías con al menos una pregunta", () => {
    // Un filtro sin preguntas le muestra al usuario el estado vacío,
    // que parece un error de la app.
    for (const category of Object.values(WORD_CATEGORY)) {
      const count = QUESTIONS.filter((q) => q.category === category).length;
      expect(count, `la categoría "${category}" quedó sin preguntas`).toBeGreaterThan(0);
    }
  });
});

describe("invariante pedagógico: la raíz no puede ser una clave de diccionario", () => {
  /*
   * Esto NO lo enforza el cargador, y es la mecánica central del juego.
   *
   * Si una raíz mapea a una sola respuesta, el jugador memoriza el par y
   * deja de leer la frase: pasa de recuperar la regla a reconocer un ítem,
   * que es justo lo que el examen no premia. El día que alguien sume 50
   * familias de un solo ítem, esto se degrada en silencio. Por eso hay
   * un test.
   */
  const AMBIGUITY_FLOOR = 0.85;

  it(`al menos el ${AMBIGUITY_FLOOR * 100}% de los ítems tiene una raíz ambigua`, () => {
    const perRoot = new Map<string, number>();
    for (const question of QUESTIONS) {
      perRoot.set(question.root, (perRoot.get(question.root) ?? 0) + 1);
    }

    const ambiguous = QUESTIONS.filter((q) => (perRoot.get(q.root) ?? 0) > 1).length;
    const ratio = ambiguous / QUESTIONS.length;

    expect(
      ratio,
      `solo ${Math.round(ratio * 100)}% de los ítems tiene raíz ambigua: sumá formas a las familias existentes antes que familias nuevas de un solo ítem`,
    ).toBeGreaterThanOrEqual(AMBIGUITY_FLOOR);
  });

  it("agrupa varias formas por familia", () => {
    const families = new Set(QUESTIONS.map((q) => q.family));

    expect(QUESTIONS.length / families.size).toBeGreaterThan(2);
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

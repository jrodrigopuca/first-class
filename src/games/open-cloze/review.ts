import type { ReviewFamily } from "../../engine/types";
import { QUESTIONS } from "./questions";
import type { OpenClozeQuestion } from "./types";

/**
 * Agrupa las explicaciones de este juego para el repaso.
 *
 * No hay contenido nuevo: es una VISTA sobre las explicaciones que ya se
 * muestran al fallar. Leídas juntas dejan de ser tips sueltos.
 *
 * Agrupa por CATEGORÍA y no por familia: acá las 45 familias tienen un
 * solo ítem cada una, así que agrupar por familia daría 45 lecciones de
 * una línea. Por tipo de palabra gramatical son 8 grupos de ~6, que sí
 * se leen como una regla.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  article: "Artículos",
  preposition: "Preposiciones dependientes",
  auxiliary: "Auxiliares y modales",
  pronoun: "Pronombres y relativos",
  quantifier: "Cuantificadores",
  linker: "Conectores",
  "fixed-phrase": "Frases hechas",
  comparative: "Comparativos",
};

/**
 * Bajo qué clave se agrupa. La exporta el juego porque solo el juego
 * sabe cuál es su unidad con sentido — y el link "ver toda la familia"
 * que sale del error usa ESTA función, así que no pueden desincronizarse.
 */
export function groupIdOf(question: OpenClozeQuestion): string {
  return question.category;
}

export function buildReview(): readonly ReviewFamily[] {
  const groups = new Map<string, ReviewFamily>();

  for (const question of QUESTIONS) {
    const id = groupIdOf(question);
    const group = groups.get(id) ?? {
      id,
      title: GROUP_LABELS[id] ?? id.replace(/-/g, " "),
      entries: [],
    };

    groups.set(id, {
      ...group,
      entries: [
        ...group.entries,
        {
          questionId: question.id,
          prompt: question.sentence,
          
          answer: question.answers[0] ?? "",
          explanation: question.explanation,
        },
      ],
    });
  }

  return [...groups.values()];
}

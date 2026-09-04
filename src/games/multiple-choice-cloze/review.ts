import type { ReviewFamily } from "../../engine/types";
import { QUESTIONS } from "./questions";
import type { ClozeQuestion } from "./types";

/**
 * Agrupa las explicaciones de este juego para el repaso.
 *
 * No hay contenido nuevo: es una VISTA sobre las explicaciones que ya se
 * muestran al fallar. Leídas juntas dejan de ser tips sueltos.
 *
 * Agrupa por CATEGORÍA: 14 de sus 23 familias son de un solo ítem.
 * Los 5 tipos de vocabulario dan grupos de ~8, que se leen de corrido.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  collocation: "Colocaciones",
  phrasal: "Phrasal verbs",
  preposition: "Preposiciones dependientes",
  linker: "Conectores",
  confusable: "Palabras que se confunden",
};

/**
 * Bajo qué clave se agrupa. La exporta el juego porque solo el juego
 * sabe cuál es su unidad con sentido — y el link "ver toda la familia"
 * que sale del error usa ESTA función, así que no pueden desincronizarse.
 */
export function groupIdOf(question: ClozeQuestion): string {
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
          
          answer: question.answer,
          explanation: question.explanation,
        },
      ],
    });
  }

  return [...groups.values()];
}

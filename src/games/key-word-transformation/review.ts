import type { ReviewFamily } from "../../engine/types";
import { QUESTIONS } from "./questions";
import type { KeyWordQuestion } from "./types";

/**
 * Agrupa las explicaciones de este juego para el repaso.
 *
 * No hay contenido nuevo: es una VISTA sobre las explicaciones que ya se
 * muestran al fallar. Leídas juntas dejan de ser tips sueltos.
 *
 * Agrupa por CATEGORÍA: 28 de sus 34 familias tienen un solo ítem, así
 * que la familia no forma lección. Las 8 estructuras gramaticales sí.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  passive: "Pasiva",
  reported: "Estilo indirecto",
  conditional: "Condicionales",
  comparative: "Comparativos",
  modal: "Modales",
  "verb-pattern": "Patrones verbales",
  expression: "Expresiones",
  phrasal: "Phrasal verbs",
};

/**
 * Bajo qué clave se agrupa. La exporta el juego porque solo el juego
 * sabe cuál es su unidad con sentido — y el link "ver toda la familia"
 * que sale del error usa ESTA función, así que no pueden desincronizarse.
 */
export function groupIdOf(question: KeyWordQuestion): string {
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
          prompt: question.gapped,
          cue: question.keyWord,
          answer: question.answers[0] ?? "",
          explanation: question.explanation,
        },
      ],
    });
  }

  return [...groups.values()];
}

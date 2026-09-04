import type { ReviewFamily } from "../../engine/types";
import { QUESTIONS } from "./questions";
import type { WordFormationQuestion } from "./types";

/**
 * Agrupa las explicaciones de este juego para el repaso.
 *
 * No hay contenido nuevo: es una VISTA sobre las explicaciones que ya se
 * muestran al fallar. Leídas juntas dejan de ser tips sueltos.
 *
 * Agrupa por FAMILIA (el lema) y no por categoría: solo 1 de sus 38
 * familias tiene un ítem suelto, así que la familia YA es la lección —
 * y además es la unidad que rompe el atajo raíz → respuesta.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {};

/**
 * Bajo qué clave se agrupa. La exporta el juego porque solo el juego
 * sabe cuál es su unidad con sentido — y el link "ver toda la familia"
 * que sale del error usa ESTA función, así que no pueden desincronizarse.
 */
export function groupIdOf(question: WordFormationQuestion): string {
  return question.family;
}

export function buildReview(): readonly ReviewFamily[] {
  const groups = new Map<string, ReviewFamily>();

  for (const question of QUESTIONS) {
    const id = groupIdOf(question);
    const group = groups.get(id) ?? {
      id,
      // La familia ES el lema: en mayúsculas se alinea con el examen.
      title: GROUP_LABELS[id] ?? id.toUpperCase(),
      entries: [],
    };

    groups.set(id, {
      ...group,
      entries: [
        ...group.entries,
        {
          questionId: question.id,
          prompt: question.sentence,
          cue: question.root,
          answer: question.answers[0] ?? "",
          explanation: question.explanation,
        },
      ],
    });
  }

  return [...groups.values()];
}

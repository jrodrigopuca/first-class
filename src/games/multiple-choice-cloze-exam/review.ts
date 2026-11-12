import type { ReviewFamily } from "../../engine/types";
import { sentenceAround, TEXTS } from "./texts";
import type { TextGap } from "./types";

/**
 * Agrupa las explicaciones por categoría, igual que la pre-práctica del
 * Part 1: las familias de este juego son singletons (un hueco por texto).
 *
 * Los ids llevan prefijo propio. El repaso abre un grupo por su id, y sin
 * prefijo "collocation" de este juego y "collocation" del otro se
 * abrirían juntos.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  collocation: "Colocaciones en contexto",
  phrasal: "Phrasal verbs en contexto",
  preposition: "Preposiciones dependientes en contexto",
  linker: "Conectores en contexto",
  confusable: "Palabras que se confunden, en contexto",
};

export function groupIdOf(gap: TextGap): string {
  return `text-${gap.category}`;
}

export function buildReview(): readonly ReviewFamily[] {
  const groups = new Map<string, ReviewFamily>();

  for (const text of TEXTS) {
    text.gaps.forEach((gap, index) => {
      const id = groupIdOf(gap);
      const group = groups.get(id) ?? {
        id,
        title: GROUP_LABELS[gap.category] ?? gap.category,
        entries: [],
      };

      groups.set(id, {
        ...group,
        entries: [
          ...group.entries,
          {
            questionId: gap.id,
            prompt: sentenceAround(text, index),
            cue: gap.label,
            answer: gap.answer,
            explanation: gap.explanation,
          },
        ],
      });
    });
  }

  return [...groups.values()];
}

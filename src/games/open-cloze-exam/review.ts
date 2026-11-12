import type { ReviewFamily } from "../../engine/types";
import { sentenceAround, TEXTS } from "./texts";
import type { TextGap } from "./types";

/**
 * Agrupa por categoría, como la pre-práctica del Part 2. Los ids llevan
 * prefijo: sin él, "linker" de este juego y "linker" de otro se abrirían
 * juntos en el repaso.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  article: "Artículos en contexto",
  preposition: "Preposiciones en contexto",
  auxiliary: "Auxiliares en contexto",
  pronoun: "Pronombres y relativos en contexto",
  quantifier: "Cuantificadores en contexto",
  linker: "Conectores en contexto",
  "fixed-phrase": "Frases hechas en contexto",
  comparative: "Comparaciones en contexto",
};

export function groupIdOf(gap: TextGap): string {
  return `text-${gap.category}`;
}

export function buildReview(): readonly ReviewFamily[] {
  const groups = new Map<string, ReviewFamily>();

  for (const text of TEXTS) {
    text.gaps.forEach((gap, index) => {
      const id = groupIdOf(gap);
      const group = groups.get(id) ?? { id, title: GROUP_LABELS[gap.category] ?? gap.category, entries: [] };

      groups.set(id, {
        ...group,
        entries: [
          ...group.entries,
          {
            questionId: gap.id,
            prompt: sentenceAround(text, index),
            cue: gap.label,
            answer: gap.answers.join(" / "),
            explanation: gap.explanation,
          },
        ],
      });
    });
  }

  return [...groups.values()];
}

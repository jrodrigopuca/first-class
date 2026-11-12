import type { ReviewFamily } from "../../engine/types";
import { sentenceAround, TEXTS } from "./texts";
import type { TextGap } from "./types";

/**
 * Agrupa por categoría gramatical: la mayoría de las raíces aparece una o
 * dos veces, y agrupar por raíz daría decenas de grupos de una línea
 * (decisión #14). Los ids llevan prefijo para no chocar con los de la
 * pre-práctica en el repaso.
 */

const GROUP_LABELS: Readonly<Record<string, string>> = {
  noun: "Sustantivos en contexto",
  adjective: "Adjetivos en contexto",
  adverb: "Adverbios en contexto",
  verb: "Verbos en contexto",
  person: "Sustantivos de persona en contexto",
  prefix: "Prefijos negativos y otros, en contexto",
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
            cue: gap.root,
            answer: gap.answers.join(" / "),
            explanation: gap.explanation,
          },
        ],
      });
    });
  }

  return [...groups.values()];
}

import { EXAM_PART, type GameManifest } from "../../engine/types";
import { buildReview } from "./review";
import { MultipleChoiceCloze } from "./MultipleChoiceCloze";

export const multipleChoiceClozeManifest: GameManifest = {
  id: "multiple-choice-cloze",
  part: EXAM_PART.MULTIPLE_CHOICE_CLOZE,
  title: "Multiple-choice Cloze",
  subtitle: "Part 1",
  description:
    "Cuatro opciones, una sola correcta: colocaciones, phrasal verbs, preposiciones y conectores.",
  Component: MultipleChoiceCloze,
  buildReview,
};

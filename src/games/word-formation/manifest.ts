import { EXAM_PART, type GameManifest } from "../../engine/types";
import { buildReview } from "./review";
import { WordFormationGame } from "./WordFormationGame";

export const wordFormationManifest: GameManifest = {
  id: "word-formation",
  part: EXAM_PART.WORD_FORMATION,
  title: "Word Formation",
  subtitle: "Part 3",
  description:
    "Transformá la palabra raíz en la forma que pide la frase: sufijos, prefijos y cambios de categoría gramatical.",
  Component: WordFormationGame,
  buildReview,
};

import { EXAM_PART, GAME_SECTION, type GameManifest } from "../../engine/types";
import { WordFormationExam } from "./WordFormationExam";

export const wordFormationExamManifest: GameManifest = {
  id: "word-formation-exam",
  part: EXAM_PART.WORD_FORMATION,
  section: GAME_SECTION.INTENSIVE,
  title: "Word Formation",
  subtitle: "Part 3 · texto",
  description:
    "Un texto completo con ocho espacios y la raíz en mayúsculas al lado: transformala para que encaje. Corregís al final.",
  Component: WordFormationExam,
};

import { EXAM_PART, GAME_SECTION, type GameManifest } from "../../engine/types";
import { buildReview } from "./review";
import { MultipleChoiceClozeExam } from "./MultipleChoiceClozeExam";

export const multipleChoiceClozeExamManifest: GameManifest = {
  id: "multiple-choice-cloze-exam",
  part: EXAM_PART.MULTIPLE_CHOICE_CLOZE,
  section: GAME_SECTION.INTENSIVE,
  title: "Multiple-choice Cloze",
  subtitle: "Part 1 · texto",
  description:
    "Un texto completo con el ejemplo y ocho espacios, como en el examen. Respondés todo y corregís al final.",
  Component: MultipleChoiceClozeExam,
  buildReview,
};

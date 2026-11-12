import { EXAM_PART, GAME_SECTION, type GameManifest } from "../../engine/types";
import { OpenClozeExam } from "./OpenClozeExam";

export const openClozeExamManifest: GameManifest = {
  id: "open-cloze-exam",
  part: EXAM_PART.OPEN_CLOZE,
  section: GAME_SECTION.INTENSIVE,
  title: "Open Cloze",
  subtitle: "Part 2 · texto",
  description:
    "Un texto completo con ocho espacios: escribís UNA palabra en cada uno, sin opciones. Corregís al final.",
  Component: OpenClozeExam,
};

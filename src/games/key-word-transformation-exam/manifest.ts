import { EXAM_PART, GAME_SECTION, type GameManifest } from "../../engine/types";
import { KeyWordTransformationExam } from "./KeyWordTransformationExam";

export const keyWordTransformationExamManifest: GameManifest = {
  id: "key-word-transformation-exam",
  part: EXAM_PART.KEY_WORD_TRANSFORMATION,
  section: GAME_SECTION.INTENSIVE,
  title: "Key Word Transformation",
  subtitle: "Part 4 · hoja",
  description:
    "Seis transformaciones en la misma hoja, con frases distintas a la pre-práctica. Respondés todo y corregís al final: 2 puntos por frase.",
  Component: KeyWordTransformationExam,
};

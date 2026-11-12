import { EXAM_PART, GAME_SECTION, type GameManifest } from "../../engine/types";
import { buildReview } from "./review";
import { OpenCloze } from "./OpenCloze";

export const openClozeManifest: GameManifest = {
  id: "open-cloze",
  part: EXAM_PART.OPEN_CLOZE,
  section: GAME_SECTION.PRE_PRACTICE,
  title: "Open Cloze",
  subtitle: "Part 2",
  description:
    "Una sola palabra en el espacio y sin opciones: artículos, preposiciones, auxiliares y frases hechas.",
  Component: OpenCloze,
  buildReview,
};

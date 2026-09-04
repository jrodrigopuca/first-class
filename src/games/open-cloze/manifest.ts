import { EXAM_PART, type GameManifest } from "../../engine/types";
import { OpenCloze } from "./OpenCloze";

export const openClozeManifest: GameManifest = {
  id: "open-cloze",
  part: EXAM_PART.OPEN_CLOZE,
  title: "Open Cloze",
  subtitle: "Part 2",
  description:
    "Una sola palabra en el hueco y sin opciones: artículos, preposiciones, auxiliares y frases hechas.",
  Component: OpenCloze,
};

import { EXAM_PART, type GameManifest } from "../../engine/types";
import { buildReview } from "./review";
import { KeyWordTransformation } from "./KeyWordTransformation";

export const keyWordTransformationManifest: GameManifest = {
  id: "key-word-transformation",
  part: EXAM_PART.KEY_WORD_TRANSFORMATION,
  title: "Key Word Transformation",
  subtitle: "Part 4",
  description:
    "Reescribí la frase con la palabra clave, sin cambiarla, usando entre dos y cinco palabras.",
  Component: KeyWordTransformation,
  buildReview,
};

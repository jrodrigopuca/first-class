import type { GameManifest } from "../engine/types";
import { openClozeManifest } from "../games/open-cloze/manifest";
import { multipleChoiceClozeManifest } from "../games/multiple-choice-cloze/manifest";
import { multipleChoiceClozeExamManifest } from "../games/multiple-choice-cloze-exam/manifest";
import { openClozeExamManifest } from "../games/open-cloze-exam/manifest";
import { wordFormationExamManifest } from "../games/word-formation-exam/manifest";
import { keyWordTransformationManifest } from "../games/key-word-transformation/manifest";
import { wordFormationManifest } from "../games/word-formation/manifest";

/**
 * El único lugar que conoce a todos los juegos.
 *
 * Agregar un juego = crear su carpeta + una línea acá. La home y las
 * rutas se actualizan solas: nadie más lista juegos a mano.
 *
 * Y ojo: los juegos NO se conocen entre sí. Ninguno importa a otro,
 * ninguno lee su estado. Se cruzan únicamente en esta lista.
 */
export const GAMES: readonly GameManifest[] = [
  multipleChoiceClozeManifest,
  openClozeManifest,
  wordFormationManifest,
  keyWordTransformationManifest,
  multipleChoiceClozeExamManifest,
  openClozeExamManifest,
  wordFormationExamManifest,
];

export function findGame(id: string): GameManifest | undefined {
  return GAMES.find((game) => game.id === id);
}

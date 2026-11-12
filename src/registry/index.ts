import { GAME_SECTION, type GameManifest, type PracticeManifest } from "../engine/types";
import { openClozeManifest } from "../games/open-cloze/manifest";
import { multipleChoiceClozeManifest } from "../games/multiple-choice-cloze/manifest";
import { multipleChoiceClozeExamManifest } from "../games/multiple-choice-cloze-exam/manifest";
import { openClozeExamManifest } from "../games/open-cloze-exam/manifest";
import { wordFormationExamManifest } from "../games/word-formation-exam/manifest";
import { keyWordTransformationExamManifest } from "../games/key-word-transformation-exam/manifest";
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
  keyWordTransformationExamManifest,
];

/**
 * Los juegos con repaso: solo la pre-práctica. El type guard es lo que le
 * deja al repaso llamar a `buildReview` sin preguntar.
 */
export const REVIEWABLE_GAMES: readonly PracticeManifest[] = GAMES.filter(
  (game): game is PracticeManifest => game.section === GAME_SECTION.PRE_PRACTICE,
);

export function findGame(id: string): GameManifest | undefined {
  return GAMES.find((game) => game.id === id);
}

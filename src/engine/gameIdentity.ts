import { createContext, use } from "react";

/**
 * Quién es el juego que se está ejecutando.
 *
 * Esto NO es plomería: es la garantía de aislamiento del progreso.
 *
 * La alternativa obvia sería que cada juego declare su propio id:
 *
 *     useSpacedRepetition({ gameId: "word-formation" })   // ❌
 *
 * ¿Y qué pasa el día que copiás una carpeta de juego para arrancar la
 * siguiente y te olvidás de cambiar ese string? Los dos juegos escriben
 * en la misma clave y comparten progreso. No crashea, no lintea mal, no
 * se ve en pantalla: simplemente te corrompe los datos de estudio.
 *
 * Acá el id lo inyecta GamePage desde el registry. Un juego NUNCA ve el
 * id de otro, así que no puede escribir en su namespace ni queriendo.
 */
export const GameIdentityContext = createContext<string | null>(null);

/** El id del juego actual. Revienta fuera de un GamePage, que es lo correcto. */
export function useGameId(): string {
  const gameId = use(GameIdentityContext);
  if (gameId === null) {
    throw new Error(
      "useGameId() fuera de un GameIdentityProvider: un juego siempre se monta desde GamePage.",
    );
  }
  return gameId;
}

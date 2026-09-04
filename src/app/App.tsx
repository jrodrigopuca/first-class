import { useRoutePath } from "../lib/router";
import { GamePage } from "./GamePage";
import { HomePage } from "./HomePage";
import { Layout } from "./Layout";
import { ReviewPage } from "./ReviewPage";

const GAME_PREFIX = "/games/";
const REVIEW_PREFIX = "/review";

/**
 * Ruteo, a mano y a la vista.
 *
 *   /                                  la home
 *   /games/<id>                        un juego
 *   /review                            repaso de todo
 *   /review/<gameId>                   repaso de un juego
 *   /review/<gameId>/<familyId>        repaso con una familia abierta
 */
export function App() {
  const path = useRoutePath();

  if (path.startsWith(GAME_PREFIX)) {
    return (
      <Layout>
        <GamePage gameId={path.slice(GAME_PREFIX.length)} />
      </Layout>
    );
  }

  if (path === REVIEW_PREFIX || path.startsWith(`${REVIEW_PREFIX}/`)) {
    const [gameId, familyId] = path.slice(REVIEW_PREFIX.length).split("/").filter(Boolean);
    return (
      <Layout>
        <ReviewPage gameId={gameId} familyId={familyId} />
      </Layout>
    );
  }

  return (
    <Layout>
      <HomePage />
    </Layout>
  );
}

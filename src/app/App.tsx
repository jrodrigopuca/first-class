import { useRoutePath } from "../lib/router";
import { GamePage } from "./GamePage";
import { HomePage } from "./HomePage";
import { Layout } from "./Layout";

const GAME_ROUTE_PREFIX = "/games/";

export function App() {
  const path = useRoutePath();
  const gameId = path.startsWith(GAME_ROUTE_PREFIX)
    ? path.slice(GAME_ROUTE_PREFIX.length)
    : null;

  return (
    <Layout>{gameId === null ? <HomePage /> : <GamePage gameId={gameId} />}</Layout>
  );
}

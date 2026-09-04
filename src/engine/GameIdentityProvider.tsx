import type { ReactNode } from "react";
import { GameIdentityContext } from "./gameIdentity";

interface GameIdentityProviderProps {
  gameId: string;
  children: ReactNode;
}

export function GameIdentityProvider({ gameId, children }: GameIdentityProviderProps) {
  return <GameIdentityContext value={gameId}>{children}</GameIdentityContext>;
}

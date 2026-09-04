import { GameIdentityProvider } from "../engine/GameIdentityProvider";
import { findGame } from "../registry";
import { toHref } from "../lib/router";
import styles from "./GamePage.module.css";

interface GamePageProps {
  gameId: string;
}

export function GamePage({ gameId }: GamePageProps) {
  const game = findGame(gameId);

  if (game === undefined) {
    return (
      <div className={styles.notFound}>
        <p>No existe ningún juego con el id “{gameId}”.</p>
        <a href={toHref("/")} className={styles.back}>
          ← Volver al inicio
        </a>
      </div>
    );
  }

  const { Component } = game;

  return (
    <>
      <div className={styles.header}>
        <a href={toHref("/")} className={styles.back}>
          ← Todos los juegos
        </a>
        <h1 className={styles.title}>{game.title}</h1>
        <p className={styles.subtitle}>
          {game.subtitle} · {game.description}
        </p>
      </div>

      {/*
        Dos garantías de aislamiento, una encima de la otra:

        `key` — al cambiar de juego React DESMONTA el anterior y monta el
        nuevo desde cero. El estado en memoria del juego A no sobrevive
        al juego B aunque quisiéramos.

        GameIdentityProvider — el id sale del registry y baja por
        contexto. El juego no lo elige, así que su progreso guardado
        tampoco puede terminar en el namespace de otro.
      */}
      <GameIdentityProvider gameId={game.id}>
        <Component key={game.id} />
      </GameIdentityProvider>
    </>
  );
}

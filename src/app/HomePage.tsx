import { GAMES } from "../registry";
import { toHref } from "../lib/router";
import styles from "./HomePage.module.css";

export function HomePage() {
  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>Entrená el Use of English</h1>
        <p className={styles.lead}>
          Las cuatro partes del Use of English, una por juego. Elegí y arrancá.
        </p>
      </section>

      <div className={styles.grid}>
        {GAMES.map((game) => (
          <a key={game.id} href={toHref(`/games/${game.id}`)} className={styles.card}>
            <span className={styles.part}>{game.subtitle}</span>
            <h2 className={styles.cardTitle}>{game.title}</h2>
            <p className={styles.cardText}>{game.description}</p>
          </a>
        ))}

      </div>
    </>
  );
}

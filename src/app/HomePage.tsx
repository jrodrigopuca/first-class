import { EXAM_PART, type ExamPart } from "../engine/types";
import { GAMES } from "../registry";
import { toHref } from "../lib/router";
import styles from "./HomePage.module.css";

interface PlannedGame {
  part: ExamPart;
  subtitle: string;
  title: string;
  description: string;
}

/** Lo que todavía no existe. Se muestra en gris para que se vea el plan. */
const ROADMAP: readonly PlannedGame[] = [
  {
    part: EXAM_PART.MULTIPLE_CHOICE_CLOZE,
    subtitle: "Part 1",
    title: "Multiple-choice Cloze",
    description: "Cuatro opciones, una colocación correcta. Vocabulario y phrasal verbs.",
  },
  {
    part: EXAM_PART.OPEN_CLOZE,
    subtitle: "Part 2",
    title: "Open Cloze",
    description: "Una sola palabra en el hueco, sin pistas. Gramática pura.",
  },
];

export function HomePage() {
  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>Entrená el Use of English</h1>
        <p className={styles.lead}>
          Un juego por cada parte del examen. Elegí uno y arrancá.
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

        {ROADMAP.map((planned) => (
          <div key={planned.part} className={`${styles.card} ${styles.soon}`}>
            <span className={styles.part}>{planned.subtitle} · pronto</span>
            <h2 className={styles.cardTitle}>{planned.title}</h2>
            <p className={styles.cardText}>{planned.description}</p>
          </div>
        ))}
      </div>
    </>
  );
}

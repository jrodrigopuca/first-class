import styles from "./Scoreboard.module.css";

interface ScoreboardProps {
  score: number;
  streak: number;
  current: number;
  total: number;
}

export function Scoreboard({ score, streak, current, total }: ScoreboardProps) {
  return (
    <div className={styles.scoreboard}>
      <div className={styles.stats}>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Puntos</p>
          <p className={styles.statValue}>{score}</p>
        </div>
        <div className={styles.stat}>
          <p className={styles.statLabel}>Racha</p>
          <p className={styles.statValue}>{streak}</p>
        </div>
      </div>
      <p className={styles.counter} aria-live="polite">
        {current} / {total}
      </p>
    </div>
  );
}

import type { ReactNode } from "react";
import { Button } from "./Button";
import { BUTTON_VARIANT } from "./constants";
import { GameCard } from "./GameCard";
import styles from "./ResultScreen.module.css";

const MASTERY_RATIO = 0.85;
const PASSING_RATIO = 0.6;

interface ResultScreenProps {
  correctCount: number;
  total: number;
  score: number;
  bestStreak: number;
  onRestart: () => void;
  /** Lista de errores. La arma cada juego: solo él sabe cómo se ve su pregunta. */
  review?: ReactNode | undefined;
}

function buildMessage(ratio: number, bestStreak: number): string {
  if (ratio >= MASTERY_RATIO) return "¡Nivel examen! Estás más que listo para esta parte.";
  if (ratio >= PASSING_RATIO) return `Muy bien. Mejor racha: ${bestStreak}. Repasá los fallos y vas.`;
  return `Buen intento. Mejor racha: ${bestStreak}. Esto se gana con repetición.`;
}

export function ResultScreen({
  correctCount,
  total,
  score,
  bestStreak,
  onRestart,
  review,
}: ResultScreenProps) {
  const ratio = total === 0 ? 0 : correctCount / total;

  return (
    <GameCard className={styles.result}>
      <p className={styles.headline}>
        {correctCount} de {total} correctas · {score} puntos
      </p>
      <p className={styles.message}>{buildMessage(ratio, bestStreak)}</p>

      {review !== undefined && (
        <div className={styles.review}>
          <p className={styles.reviewTitle}>Para repasar</p>
          {review}
        </div>
      )}

      <Button variant={BUTTON_VARIANT.PRIMARY} onClick={onRestart}>
        Jugar otra vez
      </Button>
    </GameCard>
  );
}

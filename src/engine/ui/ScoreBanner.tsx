import type { Ref } from "react";
import styles from "./ScoreBanner.module.css";

const MASTERY_RATIO = 0.85;
const PASSING_RATIO = 0.6;

interface ScoreBannerProps {
  correct: number;
  total: number;
  ref?: Ref<HTMLDivElement> | undefined;
}

function messageFor(correct: number, total: number): string {
  const ratio = total === 0 ? 0 : correct / total;
  if (ratio >= MASTERY_RATIO) return "Nivel examen. Probá con otro texto.";
  if (ratio >= PASSING_RATIO) return "Bien. Leé las explicaciones de los que fallaste.";
  return "Leé las explicaciones con calma y probá este mismo texto con otros espacios.";
}

/**
 * El resultado de un texto corregido. Focusable (tabIndex -1) para que el
 * juego le mande el foco al corregir y el lector de pantalla lo anuncie.
 */
export function ScoreBanner({ correct, total, ref }: ScoreBannerProps) {
  return (
    <div ref={ref} tabIndex={-1} className={styles.banner} role="status">
      <p className={styles.score}>
        {correct} de {total}
      </p>
      <p className={styles.message}>{messageFor(correct, total)}</p>
    </div>
  );
}

import type { ReactNode, Ref } from "react";
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
  // Genérico a propósito: lo usan los cuatro juegos de práctica intensiva,
  // con textos o con frases sueltas.
  if (ratio >= MASTERY_RATIO) return "Nivel examen.";
  if (ratio >= PASSING_RATIO) return "Bien. Leé las explicaciones de lo que fallaste.";
  return "Leé las explicaciones con calma y volvé a intentarlo.";
}

/**
 * El resultado de un texto corregido, como encabezado de la hoja: el
 * mensaje a la izquierda y el puntaje escrito a mano y circulado.
 *
 * Focusable (tabIndex -1) para que el juego le mande el foco al corregir
 * y el lector de pantalla lo anuncie.
 */
export function ScoreBanner({ correct, total, ref }: ScoreBannerProps) {
  return (
    <div ref={ref} tabIndex={-1} className={styles.banner} role="status">
      <p className={styles.message}>{messageFor(correct, total)}</p>
      <ScoreCircle>
        {correct} de {total}
      </ScoreCircle>
    </div>
  );
}

/**
 * El puntaje en birome, con un círculo trazado a mano que se pasa del
 * cierre. Se dibuja una vez al montar; con prefers-reduced-motion ya
 * aparece dibujado (lo cubre el reset global).
 */
export function ScoreCircle({ children, animate = true }: { children: ReactNode; animate?: boolean }) {
  return (
    <p className={styles.score}>
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path
          className={animate ? styles.draw : undefined}
          vectorEffect="non-scaling-stroke"
          d="M14 9C38 -1 92 0 97 22C101 44 46 52 16 45C-3 40 -1 14 34 5"
        />
      </svg>
      {children}
    </p>
  );
}

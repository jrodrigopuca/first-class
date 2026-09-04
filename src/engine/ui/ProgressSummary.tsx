import { useState } from "react";
import type { ProgressSummary as Summary } from "../leitner";
import styles from "./ProgressSummary.module.css";

interface ProgressSummaryProps {
  summary: Summary;
  onReset: () => void;
}

export function ProgressSummary({ summary, onReset }: ProgressSummaryProps) {
  // Confirmación en dos pasos dentro del componente, no con confirm().
  // Un confirm() nativo bloquea el hilo, no se puede estilar y en móvil
  // se ve como un aviso del navegador, no de tu app.
  const [confirming, setConfirming] = useState(false);

  const { total, unseen, learning, mastered, dueNow } = summary;
  const pct = (value: number) => (total === 0 ? 0 : (value / total) * 100);

  const reset = () => {
    onReset();
    setConfirming(false);
  };

  return (
    <div>
      <div className={styles.panel}>
        <div className={styles.stats}>
          <span className={`${styles.stat} ${styles.due}`}>
            <span className={styles.value}>{dueNow}</span> para repasar
          </span>
          <span className={styles.stat}>
            <span className={styles.value}>{mastered}</span> dominadas
          </span>
          <span className={styles.stat}>
            <span className={styles.value}>{learning}</span> en progreso
          </span>
          <span className={styles.stat}>
            <span className={styles.value}>{unseen}</span> sin ver
          </span>
        </div>

        <div className={styles.actions}>
          {confirming ? (
            <>
              <span className={styles.confirm}>¿Borrar todo el progreso?</span>
              <button
                type="button"
                onClick={reset}
                className={`${styles.confirmButton} ${styles.yes}`}
              >
                Sí
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={`${styles.confirmButton} ${styles.no}`}
              >
                No
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirming(true)} className={styles.link}>
              Reiniciar progreso
            </button>
          )}
        </div>
      </div>

      <div
        className={styles.bar}
        role="img"
        aria-label={`${mastered} de ${total} preguntas dominadas`}
      >
        <div
          className={`${styles.segment} ${styles.mastered}`}
          style={{ width: `${pct(mastered)}%` }}
        />
        <div
          className={`${styles.segment} ${styles.learning}`}
          style={{ width: `${pct(learning)}%` }}
        />
      </div>
    </div>
  );
}

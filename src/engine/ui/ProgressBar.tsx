import styles from "./ProgressBar.module.css";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
}

export function ProgressBar({ value }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={styles.track}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
    >
      {/* Valor dinámico -> style inline. Una clase de CSS no puede
          expresar "58.3%" sin generar una clase por cada porcentaje. */}
      <div className={styles.fill} style={{ width: `${clamped}%` }} />
    </div>
  );
}

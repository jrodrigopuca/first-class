import { clsx } from "clsx";
import styles from "./GapField.module.css";

/** Los estilos del espacio, para que cada juego arme su unidad. */
export { styles as gapStyles };

interface GapFieldState {
  filled: boolean;
  /** Le faltaba algo al pedir corrección: resaltado, no rojo. */
  missing: boolean;
  checked: boolean;
  /** Solo después de corregir. */
  correct: boolean | undefined;
  width?: "short" | "long" | undefined;
}

/** Las clases del control de un espacio según su estado. */
export function gapFieldClass({ filled, missing, checked, correct, width }: GapFieldState): string {
  return clsx(
    styles.field,
    width !== undefined && styles[width],
    filled ? styles.isFilled : styles.isEmpty,
    missing && styles.isMissing,
    checked && styles.isChecked,
    correct === true && styles.isCorrect,
    correct === false && styles.isWrong,
  );
}

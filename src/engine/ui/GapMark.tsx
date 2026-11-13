import type { ReactNode } from "react";
import { Tick } from "./Marks";
import styles from "./GapField.module.css";

/** La ✓ en birome después de un espacio correcto. */
export function GapTick() {
  return (
    <>
      <Tick className={styles.tick} />
      <span className="visually-hidden">correcto</span>
    </>
  );
}

/** La respuesta correcta, escrita a mano después de un espacio incorrecto. */
export function GapFix({ children }: { children: ReactNode }) {
  return (
    <span className={styles.fix}>
      <span className="visually-hidden">era </span>
      {children}
    </span>
  );
}

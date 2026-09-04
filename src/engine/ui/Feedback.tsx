import { clsx } from "clsx";
import type { ReactNode } from "react";
import { type FeedbackTone } from "./constants";
import styles from "./Feedback.module.css";

interface FeedbackProps {
  tone: FeedbackTone;
  title: string;
  children?: ReactNode | undefined;
}

export function Feedback({ tone, title, children }: FeedbackProps) {
  return (
    // role=status + aria-live: un lector de pantalla anuncia el resultado
    // sin que el usuario tenga que ir a buscarlo con el foco.
    <div className={clsx(styles.feedback, styles[tone])} role="status" aria-live="polite">
      <p className={styles.title}>{title}</p>
      {children !== undefined && <div className={styles.body}>{children}</div>}
    </div>
  );
}

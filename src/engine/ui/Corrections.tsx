import type { ReactNode } from "react";
import { GameCard, SheetTitle } from "./GameCard";
import { GapNumber } from "./ExamText";
import { Cross, Tick } from "./Marks";
import styles from "./Corrections.module.css";

/** La hoja "Corrección": una fila por espacio, como el margen de un corrector. */
export function CorrectionSheet({ children }: { children: ReactNode }) {
  return (
    <GameCard bleed>
      <SheetTitle>Corrección</SheetTitle>
      <ol className={styles.marks}>{children}</ol>
    </GameCard>
  );
}

interface CorrectionRowProps {
  number: number;
  correct: boolean;
  /** El rótulo del punto que se evaluaba. */
  title: ReactNode;
  /** Qué respondiste y, si fallaste, qué era. */
  verdict: ReactNode;
  children: ReactNode;
}

export function CorrectionRow({ number, correct, title, verdict, children }: CorrectionRowProps) {
  return (
    <li className={styles.row}>
      <div className={styles.gutter}>
        <GapNumber number={number} />
        {correct ? <Tick className={styles.tick} /> : <Cross className={styles.cross} />}
        <span className="visually-hidden">{correct ? "correcto" : "incorrecto"}</span>
      </div>
      <div>
        <p className={styles.chunk}>{title}</p>
        <p className={styles.verdict}>{verdict}</p>
        <p className={styles.explain}>{children}</p>
      </div>
    </li>
  );
}

/** Lo que escribió el usuario, en lápiz. */
export function Pencil({ children }: { children: ReactNode }) {
  return <span className={styles.pencil}>{children}</span>;
}

/** Lo que escribió el usuario, tachado en birome. */
export function Struck({ children }: { children: ReactNode }) {
  return <span className={styles.struck}>{children}</span>;
}

/** La palabra correcta, escrita a mano en birome. */
export function Handwritten({ children }: { children: ReactNode }) {
  return <span className={styles.hand}>{children}</span>;
}

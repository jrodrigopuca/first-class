import type { ReactNode } from "react";
import styles from "./ActionBar.module.css";

/**
 * La barra de acciones fija abajo, al alcance del pulgar: "Corregir" se ve
 * desde cualquier punto del texto. Va como último hijo del juego.
 */
export function ActionBar({ children }: { children: ReactNode }) {
  return <div className={styles.bar}>{children}</div>;
}

/** Contador + acción principal, en una fila. */
export function BarRow({ children }: { children: ReactNode }) {
  return <div className={styles.row}>{children}</div>;
}

/** Las acciones de después de corregir: en columna en el celular, en fila desde 640 px. */
export function BarStack({ children }: { children: ReactNode }) {
  return <div className={styles.stack}>{children}</div>;
}

export function BarCount({ count, total, noun }: { count: number; total: number; noun: string }) {
  return (
    <span className={styles.count}>
      <b>{count}</b> de {total} {noun}
    </span>
  );
}

/** El aviso de lo que falta antes de corregir. En resaltador, no en rojo: no es un error. */
export function BarWarning({ children }: { children: ReactNode }) {
  return (
    <div className={styles.warn} role="alert">
      {children}
    </div>
  );
}

/** Una línea secundaria del aviso, en tinta apagada. */
export function BarNote({ children }: { children: ReactNode }) {
  return <span className={styles.note}>{children}</span>;
}

/** Un botón por espacio con problema: lleva el foco a ese espacio. */
export function GapChip({ number, onClick, children }: { number: number; onClick: () => void; children?: ReactNode }) {
  return (
    <button type="button" className={styles.chip} onClick={onClick} aria-label={`Ir al espacio ${number}`}>
      {children ?? number}
    </button>
  );
}

import { clsx } from "clsx";
import type { ReactNode } from "react";
import styles from "./GameCard.module.css";

interface GameCardProps {
  children: ReactNode;
  className?: string | undefined;
  /** En el celular la hoja va de borde a borde: gana el ancho del margen. */
  bleed?: boolean | undefined;
}

/** La hoja: papel blanco sobre el fondo celeste. */
export function GameCard({ children, className, bleed = false }: GameCardProps) {
  return <div className={clsx(styles.card, bleed && styles.bleed, className)}>{children}</div>;
}

/**
 * La consigna, como en la hoja del examen: arriba, separada por una
 * regla. Quien la usa pone la primera oración en <strong>.
 */
export function Rubric({ children }: { children: ReactNode }) {
  return <p className={styles.rubric}>{children}</p>;
}

/** El título de una hoja secundaria ("Corrección"). */
export function SheetTitle({ children }: { children: ReactNode }) {
  return <h2 className={styles.sheetTitle}>{children}</h2>;
}

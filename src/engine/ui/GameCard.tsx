import { clsx } from "clsx";
import type { ReactNode } from "react";
import styles from "./GameCard.module.css";

interface GameCardProps {
  children: ReactNode;
  className?: string | undefined;
}

export function GameCard({ children, className }: GameCardProps) {
  return <div className={clsx(styles.card, className)}>{children}</div>;
}

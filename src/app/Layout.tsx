import { clsx } from "clsx";
import type { ReactNode } from "react";
import { Tick } from "../engine/ui";
import { toHref } from "../lib/router";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
  /** La home usa el ancho grande: dos hojas lado a lado en desktop. */
  wide?: boolean | undefined;
}

export function Layout({ children, wide = false }: LayoutProps) {
  return (
    <div className={clsx(styles.shell, wide && styles.wide)}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href={toHref("/")} className={styles.brand}>
            FirstClass
            <Tick className={styles.brandTick} />
          </a>
          <span className={styles.tagline}>B2 First · Use of English</span>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>Practicá todos los días. Diez minutos valen más que dos horas el domingo.</footer>
    </div>
  );
}

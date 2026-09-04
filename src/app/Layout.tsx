import type { ReactNode } from "react";
import { toHref } from "../lib/router";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href={toHref("/")} className={styles.brand}>
            First<span className={styles.brandAccent}>Class</span>
          </a>
          <span className={styles.tagline}>B2 First · Use of English</span>
        </div>
      </header>

      <main className={styles.main}>{children}</main>

      <footer className={styles.footer}>Practicá todos los días. Diez minutos valen más que dos horas el domingo.</footer>
    </div>
  );
}

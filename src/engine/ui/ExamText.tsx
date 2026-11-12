import type { ReactNode } from "react";
import styles from "./ExamText.module.css";

/**
 * Un texto con huecos, como en la hoja del examen. No sabe qué es un
 * hueco: cada juego decide cómo se dibuja (opciones, input, raíz al lado).
 *
 * Los párrafos tienen la misma forma que `Segment` de exam/gappedText,
 * pero declarada acá: el engine no importa de exam (no sabe inglés), y
 * TypeScript compara por forma, no por nombre.
 */

type Segment = string | { readonly gap: number };

interface ExamTextProps {
  title: string;
  paragraphs: readonly (readonly Segment[])[];
  renderGap: (gapIndex: number) => ReactNode;
}

export function ExamText({ title, paragraphs, renderGap }: ExamTextProps) {
  return (
    <>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.text}>
        {paragraphs.map((paragraph, p) => (
          <p key={p}>
            {paragraph.map((segment, s) =>
              typeof segment === "string" ? segment : <span key={s}>{renderGap(segment.gap)}</span>,
            )}
          </p>
        ))}
      </div>
    </>
  );
}

/** El número del hueco en un recuadro, como en la hoja del examen. */
export function GapNumber({ number }: { number: number }) {
  return <span className={styles.number}>{number}</span>;
}

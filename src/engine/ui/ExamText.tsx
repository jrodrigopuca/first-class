import type { ReactNode } from "react";
import { splitLeadingPunctuation } from "./gluePunctuation";
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
          <p key={p}>{renderParagraph(paragraph, renderGap)}</p>
        ))}
      </div>
    </>
  );
}

/**
 * Un espacio y la puntuación que lo sigue van en una unidad que no se
 * parte: sin esto, la coma después de una palabra corregida podía quedar
 * sola al principio del renglón siguiente.
 */
function renderParagraph(
  paragraph: readonly Segment[],
  renderGap: (gapIndex: number) => ReactNode,
): ReactNode[] {
  const nodes: ReactNode[] = [];
  let carry = "";

  paragraph.forEach((segment, s) => {
    if (typeof segment === "string") {
      const text = carry === "" ? segment : segment.slice(carry.length);
      carry = "";
      if (text !== "") nodes.push(text);
      return;
    }

    const next = paragraph[s + 1];
    const [punctuation] = typeof next === "string" ? splitLeadingPunctuation(next) : [""];
    carry = punctuation;
    nodes.push(
      <span key={s} className={punctuation === "" ? undefined : styles.glue}>
        {renderGap(segment.gap)}
        {punctuation}
      </span>,
    );
  });

  return nodes;
}

/** El número del hueco en un recuadro, como en la hoja del examen. */
export function GapNumber({ number }: { number: number }) {
  return <span className={styles.number}>{number}</span>;
}

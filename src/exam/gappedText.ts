import { shuffle } from "../lib/shuffle";

/**
 * El formato "texto con huecos" de los Parts 1, 2 y 3 del examen.
 *
 * Se extrajo al TERCER consumidor (decisión #12): con el Part 1 en texto
 * solo había una forma; con los Parts 2 y 3, las mismas reglas iban a
 * existir tres veces.
 *
 * Un texto se escribe con marcadores en línea —`would have {taken} up`— y
 * la lista de huecos va aparte, en el mismo orden. El marcador repite la
 * respuesta para que cada juego compruebe que el i-ésimo hueco del texto
 * es el i-ésimo de la lista: si alguien inserta uno en el medio, las
 * explicaciones se corren un lugar y el juego corrige con la respuesta
 * del vecino. Sin error a la vista.
 */

/** Como en el examen: el ejemplo (0) más ocho huecos. */
export const GAPS_PER_TEXT = 8;

/**
 * Palabras mínimas entre dos huecos del mismo párrafo. Dos huecos pegados
 * se resuelven juntos y el segundo deja de ser un ítem independiente.
 */
export const MIN_WORDS_BETWEEN_GAPS = 4;

/** Un tramo de párrafo: texto fijo, o la posición de un hueco en la lista. */
export type Segment = string | { readonly gap: number };

export type Paragraphs = readonly (readonly Segment[])[];

export interface GappedText {
  paragraphs: Paragraphs;
  /** Lo escrito dentro de cada marcador, en orden de aparición. */
  markers: readonly string[];
}

const MARKER = /\{([^{}]*)\}/g;
const SENTENCE_END = /[.!?]["'’”)]*\s*$/;

function wordsIn(text: string): number {
  return text.split(/\s+/).filter((word) => /[a-z0-9]/i.test(word)).length;
}

/**
 * Parte los párrafos en tramos y valida las reglas de FORMA que valen
 * para los tres Parts. Lanza un Error con el problema; el juego le agrega
 * su prefijo.
 */
export function parseGappedText(raw: readonly string[]): GappedText {
  const markers: string[] = [];

  const paragraphs = raw.map((paragraph, p) => {
    const segments: Segment[] = [];
    let cursor = 0;

    for (const match of paragraph.matchAll(MARKER)) {
      const before = paragraph.slice(cursor, match.index);
      const word = match[1] ?? "";

      if ((cursor === 0 && before.trim() === "") || SENTENCE_END.test(before)) {
        // Si abriera la frase, la respuesta iría en mayúscula: en el Part 1
        // delata la opción; en el 2 y el 3, te dice que es inicio de frase.
        throw new Error(`el hueco {${word}} abre una frase (párrafo ${p + 1})`);
      }
      if (cursor > 0 && wordsIn(before) < MIN_WORDS_BETWEEN_GAPS) {
        throw new Error(
          `el hueco {${word}} está a ${wordsIn(before)} palabras del anterior; ` +
            `el mínimo es ${MIN_WORDS_BETWEEN_GAPS}`,
        );
      }

      if (before !== "") segments.push(before);
      segments.push({ gap: markers.length });
      markers.push(word);
      cursor = match.index + match[0].length;
    }

    const rest = paragraph.slice(cursor);
    if (rest !== "") segments.push(rest);

    for (const segment of segments) {
      if (typeof segment === "string" && /[{}]/.test(segment)) {
        throw new Error(`llave suelta en el párrafo ${p + 1}: un marcador mal cerrado`);
      }
    }
    return segments;
  });

  return { paragraphs, markers };
}

/**
 * La frase que contiene el hueco, con `___` en su lugar y los demás
 * huecos resueltos con `fill`. Es lo que muestra el repaso.
 */
export function sentenceAround(
  paragraphs: Paragraphs,
  gapIndex: number,
  fill: (index: number) => string,
): string {
  for (const paragraph of paragraphs) {
    if (!paragraph.some((segment) => typeof segment !== "string" && segment.gap === gapIndex)) {
      continue;
    }

    const filled = paragraph
      .map((segment) => {
        if (typeof segment === "string") return segment;
        return segment.gap === gapIndex ? "___" : fill(segment.gap);
      })
      .join("");

    return filled.split(/(?<=[.!?])\s+/).find((sentence) => sentence.includes("___")) ?? filled;
  }
  return "";
}

/**
 * Sortea qué huecos salen en este intento: `count` posiciones entre 1 y
 * `totalGaps - 1` (la 0 es siempre el ejemplo), ORDENADAS. Al azar para
 * que no te sepas el texto; en orden para que el hueco 3 esté siempre
 * después del 2, como en el examen.
 */
export function drawGaps(totalGaps: number, count: number = GAPS_PER_TEXT): readonly number[] {
  const candidates = Array.from({ length: Math.max(0, totalGaps - 1) }, (_, i) => i + 1);
  return shuffle(candidates)
    .slice(0, count)
    .sort((a, b) => a - b);
}

/**
 * Puntuación que no puede quedar sola al principio de un renglón.
 *
 * Es tipografía, no idioma: vale para cualquier texto con espacios. Por eso
 * vive en el engine y no en exam.
 */
const LEADING_PUNCTUATION = /^[.,;:!?…)\]}»”’'"]+/;

/**
 * Parte un tramo de texto en la puntuación con la que arranca y el resto.
 *
 * Después de un espacio el navegador puede cortar el renglón: el espacio
 * se dibuja como un bloque en línea (inline-block), y después de un bloque
 * así hay oportunidad de corte aunque lo que siga sea una coma. Separar la
 * puntuación permite pegarla al espacio en una unidad que no se parte.
 */
export function splitLeadingPunctuation(text: string): readonly [punctuation: string, rest: string] {
  const punctuation = LEADING_PUNCTUATION.exec(text)?.[0] ?? "";
  return [punctuation, text.slice(punctuation.length)];
}

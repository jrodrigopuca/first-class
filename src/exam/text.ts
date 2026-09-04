/**
 * Reglas de texto del B2 First, compartidas por todos los juegos.
 *
 * Esta capa existe porque el Part 2 fue el TERCER consumidor de las
 * mismas reglas. Con dos —uno de ellos trivial— extraer habría sido
 * adivinar cuál era la abstracción correcta; con tres, la duplicación
 * es un hecho y la forma de la abstracción ya no es una hipótesis.
 *
 * Va aparte del engine a propósito: el engine no sabe inglés. Sabe de
 * rondas, puntaje y repetición espaciada, y esa ignorancia es lo que le
 * permite servir a cualquier juego. Estas reglas, en cambio, son de
 * Cambridge y de nadie más.
 */

const IRREGULAR_CONTRACTIONS: Readonly<Record<string, string>> = {
  "won't": "will not",
  "can't": "can not",
  cannot: "can not",
  "shan't": "shall not",
};

/**
 * Cambridge cuenta las contracciones como DOS palabras: "don't" son
 * do + not. Sin expandir antes de contar, aceptarías respuestas de seis
 * palabras creyendo que son de cinco — y le enseñarías al alumno algo
 * que el examen le va a marcar mal.
 */
export function expandContractions(text: string): string {
  let out = text;
  for (const [contraction, expansion] of Object.entries(IRREGULAR_CONTRACTIONS)) {
    out = out.replaceAll(contraction, expansion);
  }
  return out
    .replace(/n't\b/g, " not")
    .replace(/'ll\b/g, " will")
    .replace(/'ve\b/g, " have")
    .replace(/'re\b/g, " are")
    .replace(/'m\b/g, " am")
    .replace(/'d\b/g, " would");
}

/** Minúsculas, sin puntuación, espacios colapsados. */
export function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]/g, "")
    .replace(/\s+/g, " ");
}

/** Palabras según las cuenta Cambridge, no según las cuenta un split. */
export function countWords(text: string): number {
  const expanded = expandContractions(normalize(text));
  return expanded.split(" ").filter((word) => word.length > 0).length;
}

/**
 * Las palabras escritas Y su forma expandida.
 *
 * Sirve para buscar una palabra clave que el alumno pudo escribir de
 * las dos maneras: si la clave es NOT y escribió "hadn't", hay que
 * encontrarla igual.
 */
export function wordsOf(text: string): ReadonlySet<string> {
  const clean = normalize(text);
  return new Set([...clean.split(" "), ...expandContractions(clean).split(" ")]);
}

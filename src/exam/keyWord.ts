import { countWords, expandContractions, normalize, wordsOf } from "./text";

/**
 * Las reglas del Part 4 (Key Word Transformation) del B2 First.
 *
 * Viven acá y no en un juego porque las usan dos: la pre-práctica (con
 * repetición espaciada) y la práctica intensiva (formato examen). Es el
 * MISMO algoritmo de puntaje en los dos; duplicarlo invitaría a que
 * diverjan, y un alumno vería la misma respuesta valer 2 en un juego y 1
 * en el otro. Ver decisión #18.
 */

/** Cambridge exige entre 2 y 5 palabras, palabra clave incluida. */
export const MIN_WORDS = 2;
export const MAX_WORDS = 5;

/** Dos puntos por ítem: uno por cada mitad de la respuesta. */
export const MARKS_PER_ITEM = 2;

/** Una respuesta aceptada partida en sus dos mitades puntuables. */
export type AnswerHalves = readonly [first: string, second: string];

export const SUBMISSION_ISSUE = {
  EMPTY: "empty",
  TOO_FEW: "too-few",
  TOO_MANY: "too-many",
  MISSING_KEY_WORD: "missing-key-word",
} as const;

export type SubmissionIssue = (typeof SUBMISSION_ISSUE)[keyof typeof SUBMISSION_ISSUE];

/**
 * Reglas que se comprueban ANTES de corregir. Pasarse de cinco palabras
 * no es responder mal: es una respuesta INVÁLIDA, y no llega a puntuarse.
 */
export function findSubmissionIssue(keyWord: string, raw: string): SubmissionIssue | null {
  const clean = normalize(raw);
  if (clean === "") return SUBMISSION_ISSUE.EMPTY;

  const wordCount = countWords(clean);
  if (wordCount < MIN_WORDS) return SUBMISSION_ISSUE.TOO_FEW;
  if (wordCount > MAX_WORDS) return SUBMISSION_ISSUE.TOO_MANY;

  // La clave se busca en la forma escrita Y en la expandida: si el alumno
  // escribe "cannot" y la clave es CANNOT, expandir a "can not" haría
  // desaparecer la palabra que estamos buscando.
  if (!wordsOf(clean).has(keyWord.toLowerCase())) return SUBMISSION_ISSUE.MISSING_KEY_WORD;

  return null;
}

/**
 * Lee una respuesta del dataset, escrita con una barra donde se parte:
 * "is said | to be". Lanza un Error si no cumple las reglas del examen;
 * el juego le agrega su prefijo.
 */
export function parseMarkedAnswer(keyWord: string, marked: string): { full: string; halves: AnswerHalves } {
  const parts = marked.split("|").map((part) => part.trim());
  const [first, second] = parts;
  if (parts.length !== 2 || first === undefined || second === undefined || first === "" || second === "") {
    throw new Error(`"${marked}" tiene que partirse en dos mitades con una barra: "is said | to be"`);
  }

  const full = `${first} ${second}`;
  if (full !== normalize(full)) throw new Error(`la respuesta "${full}" no está normalizada`);

  const words = countWords(full);
  if (words < MIN_WORDS || words > MAX_WORDS) {
    throw new Error(`"${full}" tiene ${words} palabras; Cambridge exige ${MIN_WORDS}-${MAX_WORDS}`);
  }
  // La trampa clásica: la palabra clave FUERA del hueco. La frase se lee
  // perfecta y el ítem es inválido.
  if (!full.split(" ").includes(keyWord.toLowerCase())) {
    throw new Error(`"${full}" no contiene la palabra clave ${keyWord}`);
  }

  return { full, halves: [first, second] };
}

/**
 * Palabras para comparar: normalizadas y con las contracciones expandidas.
 * "wasn't light enough" y "was not light enough" son la misma respuesta.
 */
function comparable(text: string): readonly string[] {
  return expandContractions(normalize(text))
    .split(" ")
    .filter((word) => word !== "");
}

function startsWith(words: readonly string[], prefix: readonly string[]): boolean {
  return prefix.length <= words.length && prefix.every((word, i) => words[i] === word);
}

function endsWith(words: readonly string[], suffix: readonly string[]): boolean {
  const offset = words.length - suffix.length;
  return offset >= 0 && suffix.every((word, i) => words[offset + i] === word);
}

export interface Marking {
  /** 0, 1 o 2, como en el examen. */
  marks: number;
  /** Qué mitades acertó, contra la respuesta aceptada más cercana. */
  firstHalf: boolean;
  secondHalf: boolean;
  /** Esa respuesta aceptada, partida: para explicar qué faltó. */
  closest: AnswerHalves;
}

/**
 * Puntúa como Cambridge: dos puntos por ítem, uno por cada mitad.
 *
 * - Respuesta exacta (contracciones aparte) → 2.
 * - Empieza con la primera mitad, o termina con la segunda → 1 cada una.
 * - Las dos mitades presentes pero con algo de más en el medio → 1: un
 *   error en cualquier parte cuesta un punto.
 *
 * Compara contra cada respuesta aceptada y se queda con la mejor. Asume
 * que ya pasó findSubmissionIssue.
 */
export function markAnswer(accepted: readonly AnswerHalves[], raw: string): Marking {
  const written = comparable(raw);
  let best: Marking | undefined;

  for (const halves of accepted) {
    const first = comparable(halves[0]);
    const second = comparable(halves[1]);
    const exact = written.join(" ") === [...first, ...second].join(" ");
    const firstHalf = exact || startsWith(written, first);
    const secondHalf = exact || endsWith(written, second);
    const marks = exact ? MARKS_PER_ITEM : Math.min(MARKS_PER_ITEM - 1, Number(firstHalf) + Number(secondHalf));

    if (best === undefined || marks > best.marks) best = { marks, firstHalf, secondHalf, closest: halves };
  }

  return best ?? { marks: 0, firstHalf: false, secondHalf: false, closest: accepted[0] ?? ["", ""] };
}

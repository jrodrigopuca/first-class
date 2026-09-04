import { MAX_WORDS, MIN_WORDS, type KeyWordQuestion } from "./types";

/**
 * Corrección del Part 4. Toda la lógica sucia del dominio vive acá,
 * fuera del componente y fuera del engine: es JavaScript puro y se
 * testea sin renderizar nada.
 */

/**
 * Cambridge cuenta las contracciones como DOS palabras: "don't" son
 * do + not. Si no expandís antes de contar, aceptás respuestas de seis
 * palabras creyendo que son de cinco, y le enseñás al alumno algo que
 * el examen le va a marcar mal.
 */
const IRREGULAR_CONTRACTIONS: Readonly<Record<string, string>> = {
  "won't": "will not",
  "can't": "can not",
  "cannot": "can not",
  "shan't": "shall not",
};

function expandContractions(text: string): string {
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

export const SUBMISSION_ISSUE = {
  EMPTY: "empty",
  TOO_FEW: "too-few",
  TOO_MANY: "too-many",
  MISSING_KEY_WORD: "missing-key-word",
} as const;

export type SubmissionIssue = (typeof SUBMISSION_ISSUE)[keyof typeof SUBMISSION_ISSUE];

/**
 * Reglas del examen que se comprueban ANTES de corregir.
 *
 * Ojo con la distinción, que no es cosmética: pasarse de cinco palabras
 * no es "responder mal", es una respuesta INVÁLIDA. En el examen te dan
 * cero igual, pero para aprender no es lo mismo equivocarte de estructura
 * que pasarte de largo. Por eso esto devuelve un problema concreto y el
 * intento ni siquiera llega al motor de puntaje.
 */
export function findSubmissionIssue(
  question: KeyWordQuestion,
  raw: string,
): SubmissionIssue | null {
  const clean = normalize(raw);
  if (clean === "") return SUBMISSION_ISSUE.EMPTY;

  const wordCount = countWords(clean);
  if (wordCount < MIN_WORDS) return SUBMISSION_ISSUE.TOO_FEW;
  if (wordCount > MAX_WORDS) return SUBMISSION_ISSUE.TOO_MANY;

  // La clave se busca en la forma escrita Y en la expandida: si el
  // alumno escribe "cannot" y la clave es CANNOT, expandir a "can not"
  // haría desaparecer la palabra que estamos buscando.
  const writtenWords = new Set([
    ...clean.split(" "),
    ...expandContractions(clean).split(" "),
  ]);
  if (!writtenWords.has(question.keyWord.toLowerCase())) {
    return SUBMISSION_ISSUE.MISSING_KEY_WORD;
  }

  return null;
}

/** Corrección propiamente dicha. Asume que ya pasó findSubmissionIssue. */
export function isCorrect(question: KeyWordQuestion, answer: string): boolean {
  return question.answers.includes(normalize(answer));
}

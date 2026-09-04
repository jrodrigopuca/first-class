import type { ComponentType } from "react";

/**
 * Contrato compartido por TODOS los juegos.
 *
 * Ojo con la distinción, que es la que sostiene toda la arquitectura:
 * acá viven TIPOS y CONSTANTES, no estado. Dos juegos comparten la
 * definición de "qué es una pregunta" igual que dos departamentos
 * comparten la estructura del edificio. Ninguno comparte el living.
 */

export const ROUND_STATUS = {
  PLAYING: "playing",
  ANSWERED: "answered",
  FINISHED: "finished",
} as const;

export type RoundStatus = (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS];

/** Las 4 partes gamificables del Reading & Use of English (B2 First). */
export const EXAM_PART = {
  MULTIPLE_CHOICE_CLOZE: 1,
  OPEN_CLOZE: 2,
  WORD_FORMATION: 3,
  KEY_WORD_TRANSFORMATION: 4,
} as const;

export type ExamPart = (typeof EXAM_PART)[keyof typeof EXAM_PART];

export const DIFFICULTY = {
  EASY: 1,
  MEDIUM: 2,
  HARD: 3,
} as const;

export type Difficulty = (typeof DIFFICULTY)[keyof typeof DIFFICULTY];

/**
 * Mínimo común denominador de una pregunta. Cada juego lo extiende.
 *
 * El `id` es string y NO posicional (usá "construct-construction", no 42).
 * Con repetición espaciada el progreso del jugador se guarda POR ítem:
 * si los ids fueran correlativos, insertar una pregunta en el medio
 * correría todos los siguientes y le reasignaría a cada uno el historial
 * de otro. Los ids son la llave de la memoria del usuario: son para
 * siempre.
 */
export interface Question {
  id: string;
  level: Difficulty;
}

/** Una explicación concreta, atada al ítem que la generó. */
export interface ReviewEntry {
  /** El mismo id que usa la repetición espaciada: así se cruza con el progreso. */
  questionId: string;
  /** La frase, con ___ donde iba la respuesta. */
  prompt: string;
  /** Pista extra que mostraba el juego: la raíz, la palabra clave. */
  cue?: string | undefined;
  answer: string;
  explanation: string;
}

/**
 * Un grupo de explicaciones emparentadas.
 *
 * Es lo que convierte 228 tips sueltos en material de estudio: leídas
 * juntas, las cinco explicaciones de "do vs make" SON la lección; por
 * separado son cinco datos inconexos vistos en cinco días distintos.
 */
export interface ReviewFamily {
  id: string;
  title: string;
  entries: readonly ReviewEntry[];
}

/**
 * La tarjeta de identidad de un juego. La home, el router y el repaso
 * leen ESTO, nunca el interior del juego.
 *
 * `buildReview` es obligatorio a propósito. Un juego sin material de
 * repaso desaparecería del estudio en silencio, y "en silencio" es
 * exactamente el tipo de bug que este proyecto viene evitando. Si algún
 * día aparece un juego que genuinamente no tiene familias, cambiamos el
 * tipo entonces — con el caso real en la mano, no antes.
 */
export interface GameManifest {
  id: string;
  part: ExamPart;
  title: string;
  subtitle: string;
  description: string;
  Component: ComponentType;
  buildReview: () => readonly ReviewFamily[];
}

/**
 * Lo que se recuerda de UN ítem entre sesiones.
 *
 * Deliberadamente chico: cinco números por ítem. Con 142 ítems son unos
 * 10 KB en total, que entran de sobra en localStorage sin acercarse
 * al límite.
 */
export interface ItemProgress {
  /** Caja Leitner, de 1 (recién fallado) a 5 (dominado). */
  box: number;
  /** Momento a partir del cual conviene repasarlo (epoch ms). */
  dueAt: number;
  lastSeenAt: number;
  attempts: number;
  hits: number;
}

/** Progreso de un juego, indexado por el id estable de cada pregunta. */
export type ProgressMap = Readonly<Record<string, ItemProgress>>;

/**
 * Estrategia de armado de ronda. Es el punto de extensión que le permite
 * al motor no saber qué es la repetición espaciada.
 *
 * El motor pregunta "dame una ronda" y avisa "esto pasó". Quién decide
 * y quién recuerda es problema del scheduler. Sin scheduler, el motor
 * baraja al azar y no recuerda nada — que es exactamente lo que hacía
 * antes de que existiera esto.
 */
export interface RoundScheduler<TQuestion extends Question> {
  select: (questions: readonly TQuestion[], roundLength: number) => TQuestion[];
  record: (question: TQuestion, correct: boolean) => void;
}

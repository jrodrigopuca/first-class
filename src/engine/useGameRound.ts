import { useState } from "react";
import { shuffle } from "../lib/shuffle";
import {
  ROUND_STATUS,
  type Question,
  type RoundScheduler,
  type RoundStatus,
} from "./types";

const POINTS_BASE = 10;
const POINTS_WITH_STREAK = 15;
const STREAK_BONUS_FROM = 3;

/** Estado interno. UN objeto, no ocho useState sueltos — ver nota abajo. */
interface RoundState<TQuestion extends Question> {
  questions: readonly TQuestion[];
  index: number;
  status: RoundStatus;
  wasCorrect: boolean;
  score: number;
  streak: number;
  bestStreak: number;
  mistakes: readonly TQuestion[];
}

export interface GameRoundConfig<TQuestion extends Question, TAnswer> {
  /** Pool completo del que se sortea la ronda. */
  questions: readonly TQuestion[];
  /** Cuántas preguntas por partida. */
  roundLength: number;
  /**
   * Identidad de la partida. Cuando CAMBIA, se arma una ronda nueva.
   * Usá un valor que vos controles (la categoría, el nivel), nunca
   * la identidad referencial del array: eso es una bomba de tiempo.
   */
  roundKey: string;
  /** Corrección: solo el juego sabe qué significa "bien" en su dominio. */
  isCorrect: (question: TQuestion, answer: TAnswer) => boolean;
  /**
   * Quién elige las preguntas y quién recuerda los resultados.
   *
   * Sin scheduler el motor baraja al azar y no recuerda nada — el
   * comportamiento que tenía antes de que existiera la repetición
   * espaciada. Con scheduler, el motor sigue sin saber qué es una caja
   * Leitner: solo pide una ronda y avisa qué pasó.
   */
  scheduler?: RoundScheduler<TQuestion> | undefined;
}

export interface GameRound<TQuestion extends Question, TAnswer> {
  question: TQuestion | undefined;
  index: number;
  total: number;
  status: RoundStatus;
  wasCorrect: boolean;
  score: number;
  streak: number;
  bestStreak: number;
  correctCount: number;
  mistakes: readonly TQuestion[];
  /** 0–100, basado en preguntas RESPONDIDAS. */
  progress: number;
  isLastQuestion: boolean;
  isEmpty: boolean;
  submit: (answer: TAnswer) => void;
  next: () => void;
  restart: () => void;
}

/** Selección por defecto: barajar y cortar. Sin memoria, como antes. */
function selectAtRandom<TQuestion extends Question>(
  questions: readonly TQuestion[],
  roundLength: number,
): TQuestion[] {
  return shuffle(questions).slice(0, Math.min(roundLength, questions.length));
}

function createRound<TQuestion extends Question>(
  questions: readonly TQuestion[],
  roundLength: number,
  select: (questions: readonly TQuestion[], roundLength: number) => TQuestion[],
): RoundState<TQuestion> {
  return {
    questions: select(questions, roundLength),
    index: 0,
    status: ROUND_STATUS.PLAYING,
    wasCorrect: false,
    score: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: [],
  };
}

/**
 * Transición pura: estado + resultado -> estado nuevo.
 * Que sea pura y esté fuera del hook la hace testeable sin React
 * y sin renderizar un solo componente.
 */
function applyAnswer<TQuestion extends Question>(
  prev: RoundState<TQuestion>,
  question: TQuestion,
  correct: boolean,
): RoundState<TQuestion> {
  if (!correct) {
    return {
      ...prev,
      status: ROUND_STATUS.ANSWERED,
      wasCorrect: false,
      streak: 0,
      mistakes: [...prev.mistakes, question],
    };
  }

  const streak = prev.streak + 1;
  return {
    ...prev,
    status: ROUND_STATUS.ANSWERED,
    wasCorrect: true,
    score: prev.score + (prev.streak >= STREAK_BONUS_FROM ? POINTS_WITH_STREAK : POINTS_BASE),
    streak,
    bestStreak: Math.max(prev.bestStreak, streak),
  };
}

function advance<TQuestion extends Question>(
  prev: RoundState<TQuestion>,
): RoundState<TQuestion> {
  if (prev.status !== ROUND_STATUS.ANSWERED) return prev;

  return prev.index < prev.questions.length - 1
    ? { ...prev, index: prev.index + 1, status: ROUND_STATUS.PLAYING, wasCorrect: false }
    : { ...prev, status: ROUND_STATUS.FINISHED };
}

/**
 * El motor: ronda, puntaje, racha, errores y progreso.
 * No sabe nada de word formation, ni de open cloze, ni de HTML.
 * Cada juego que lo llama recibe su PROPIA instancia de estado —
 * ahí está el aislamiento que pediste, garantizado por React mismo.
 */
export function useGameRound<TQuestion extends Question, TAnswer>({
  questions,
  roundLength,
  roundKey,
  isCorrect,
  scheduler,
}: GameRoundConfig<TQuestion, TAnswer>): GameRound<TQuestion, TAnswer> {
  const select = scheduler?.select ?? selectAtRandom;
  const [state, setState] = useState(() => createRound(questions, roundLength, select));
  const [activeKey, setActiveKey] = useState(roundKey);

  // Reset al cambiar de partida, en render. Es el patrón oficial de React
  // para "ajustar estado cuando cambia una prop": corre ANTES de pintar,
  // sin el parpadeo de un useEffect. El bug del componente original era
  // justamente esto: la ronda se armaba una sola vez y no se rearmaba nunca.
  if (roundKey !== activeKey) {
    setActiveKey(roundKey);
    setState(createRound(questions, roundLength, select));
  }

  const total = state.questions.length;
  const question = state.questions[state.index];

  const submit = (answer: TAnswer) => {
    if (state.status !== ROUND_STATUS.PLAYING || question === undefined) return;
    // La corrección se calcula ACÁ, no dentro del updater: los updaters
    // de React tienen que ser puros y React puede invocarlos dos veces.
    const correct = isCorrect(question, answer);
    // Se avisa al scheduler ANTES de tocar el estado del motor: es un
    // efecto y va en el handler, nunca dentro del updater.
    scheduler?.record(question, correct);
    setState((prev) => applyAnswer(prev, question, correct));
  };

  const next = () => setState(advance);

  // createRound baraja (Math.random): impura. Por eso se llama fuera
  // del updater y se pasa el valor ya calculado.
  const restart = () => setState(createRound(questions, roundLength, select));

  const answeredCount =
    state.status === ROUND_STATUS.FINISHED
      ? total
      : state.index + (state.status === ROUND_STATUS.ANSWERED ? 1 : 0);

  return {
    question,
    index: state.index,
    total,
    status: state.status,
    wasCorrect: state.wasCorrect,
    score: state.score,
    streak: state.streak,
    bestStreak: state.bestStreak,
    correctCount: answeredCount - state.mistakes.length,
    mistakes: state.mistakes,
    progress: total === 0 ? 0 : (answeredCount / total) * 100,
    isLastQuestion: state.index === total - 1,
    isEmpty: total === 0,
    submit,
    next,
    restart,
  };
}

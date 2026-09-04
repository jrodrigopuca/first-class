import { useState } from "react";
import { useGameId } from "./gameIdentity";
import { applyResult, selectRound, summarize, type ProgressSummary } from "./leitner";
import { clearProgress, loadProgress, saveProgress } from "./storage";
import type { ProgressMap, Question, RoundScheduler } from "./types";

export interface SpacedRepetition<TQuestion extends Question> {
  /** Se lo pasás tal cual a useGameRound. */
  scheduler: RoundScheduler<TQuestion>;
  summary: (questions: readonly TQuestion[]) => ProgressSummary;
  reset: () => void;
}

/**
 * Une las tres piezas: el algoritmo (leitner), la persistencia (storage)
 * y la identidad del juego (context).
 *
 * El juego que llama a esto no sabe en qué clave se guarda nada, y ese
 * es justamente el punto.
 */
export function useSpacedRepetition<TQuestion extends Question>(): SpacedRepetition<TQuestion> {
  const gameId = useGameId();
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress(gameId));

  const scheduler: RoundScheduler<TQuestion> = {
    // `select` se llama durante el armado de la ronda: solo LEE.
    select: (questions, roundLength) =>
      selectRound(questions, roundLength, progress, Date.now()),

    // `record` se llama desde un event handler: acá sí se escribe.
    //
    // El mapa nuevo se calcula FUERA de setProgress. Escribir en disco
    // dentro de un updater sería un efecto adentro de una función que
    // React exige pura, y que puede invocar dos veces. Zafaríamos por
    // idempotencia, igual que zafaba el componente original — y zafar
    // por accidente no es zafar.
    record: (question, correct) => {
      const next: ProgressMap = {
        ...progress,
        [question.id]: applyResult(progress[question.id], correct, Date.now()),
      };
      saveProgress(gameId, next);
      setProgress(next);
    },
  };

  return {
    scheduler,
    summary: (questions) => summarize(questions, progress, Date.now()),
    reset: () => {
      clearProgress(gameId);
      setProgress({});
    },
  };
}

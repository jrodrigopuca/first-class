import { shuffle } from "../../lib/shuffle";
import type { ClozeQuestion } from "./types";

/**
 * Arma las cuatro opciones en orden aleatorio.
 *
 * ¿Por qué barajar y no guardar el orden en el JSON? Porque si la
 * correcta estuviera siempre en el mismo lugar, el jugador terminaría
 * memorizando posiciones en vez de vocabulario. Es el mismo problema que
 * el mapeo 1:1 raíz→respuesta del Part 3, con otra cara.
 */
export function buildOptions(question: ClozeQuestion): readonly string[] {
  return shuffle([question.answer, ...question.distractors]);
}

export function isCorrect(question: ClozeQuestion, selected: string): boolean {
  return selected === question.answer;
}

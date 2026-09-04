// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ROUND_STATUS, type Question, type RoundScheduler } from "./types";
import { useGameRound } from "./useGameRound";

/*
 * El motor baraja con Math.random, así que estos tests le pasan un
 * scheduler que elige en orden. No es un truco para el test: es el mismo
 * punto de extensión que usa la repetición espaciada en producción.
 * Si hubiera que mockear un módulo para testear esto, el diseño estaría mal.
 */

interface TestQuestion extends Question {
  answer: string;
}

const QUESTIONS: readonly TestQuestion[] = [
  { id: "q1", level: 1, answer: "uno" },
  { id: "q2", level: 1, answer: "dos" },
  { id: "q3", level: 1, answer: "tres" },
  { id: "q4", level: 1, answer: "cuatro" },
  { id: "q5", level: 1, answer: "cinco" },
];

const OTHER_QUESTIONS: readonly TestQuestion[] = [
  { id: "otra1", level: 2, answer: "a" },
  { id: "otra2", level: 2, answer: "b" },
];

function inOrder(log: Array<[string, boolean]> = []): RoundScheduler<TestQuestion> {
  return {
    select: (questions, roundLength) => questions.slice(0, roundLength),
    record: (question, correct) => {
      log.push([question.id, correct]);
    },
  };
}

const isCorrect = (question: TestQuestion, answer: string) => question.answer === answer;

interface Props {
  questions: readonly TestQuestion[];
  roundKey: string;
  scheduler: RoundScheduler<TestQuestion>;
}

function setup(overrides: Partial<Props> = {}) {
  const props: Props = {
    questions: QUESTIONS,
    roundKey: "todas",
    scheduler: inOrder(),
    ...overrides,
  };

  return renderHook(
    (current: Props) =>
      useGameRound<TestQuestion, string>({
        questions: current.questions,
        roundLength: 5,
        roundKey: current.roundKey,
        isCorrect,
        scheduler: current.scheduler,
      }),
    { initialProps: props },
  );
}

describe("estado inicial", () => {
  it("arranca en la primera pregunta con el marcador en cero", () => {
    const { result } = setup();

    expect(result.current.question?.id).toBe("q1");
    expect(result.current.index).toBe(0);
    expect(result.current.score).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.status).toBe(ROUND_STATUS.PLAYING);
    expect(result.current.progress).toBe(0);
  });

  it("avisa que está vacío cuando no hay preguntas", () => {
    const { result } = setup({ questions: [] });

    expect(result.current.isEmpty).toBe(true);
    expect(result.current.question).toBeUndefined();
  });
});

describe("puntaje y racha", () => {
  it("suma 10 puntos y arranca la racha al acertar", () => {
    const { result } = setup();

    act(() => result.current.submit("uno"));

    expect(result.current.wasCorrect).toBe(true);
    expect(result.current.score).toBe(10);
    expect(result.current.streak).toBe(1);
    expect(result.current.status).toBe(ROUND_STATUS.ANSWERED);
  });

  it("corta la racha y anota el error al fallar", () => {
    const { result } = setup();

    act(() => result.current.submit("respuesta equivocada"));

    expect(result.current.wasCorrect).toBe(false);
    expect(result.current.score).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.mistakes.map((q) => q.id)).toEqual(["q1"]);
  });

  it("paga 15 en vez de 10 a partir del cuarto acierto seguido", () => {
    const { result } = setup();

    act(() => result.current.submit("uno"));
    act(() => result.current.next());
    act(() => result.current.submit("dos"));
    act(() => result.current.next());
    act(() => result.current.submit("tres"));
    act(() => result.current.next());
    act(() => result.current.submit("cuatro"));

    expect(result.current.streak).toBe(4);
    expect(result.current.score).toBe(45); // 10 + 10 + 10 + 15
  });

  it("vuelve a pagar 10 después de cortar una racha larga", () => {
    const { result } = setup();

    act(() => result.current.submit("uno"));
    act(() => result.current.next());
    act(() => result.current.submit("dos"));
    act(() => result.current.next());
    act(() => result.current.submit("tres"));
    act(() => result.current.next());
    act(() => result.current.submit("mal"));
    act(() => result.current.next());
    act(() => result.current.submit("cinco"));

    expect(result.current.streak).toBe(1);
    expect(result.current.score).toBe(40); // 30 + 0 + 10
  });

  it("ignora una segunda respuesta a la misma pregunta", () => {
    const { result } = setup();

    act(() => result.current.submit("uno"));
    act(() => result.current.submit("uno"));

    expect(result.current.score).toBe(10);
  });
});

describe("avance y progreso", () => {
  it("mueve el progreso ya con la primera respuesta, no recién al avanzar", () => {
    // Regresión: la versión original calculaba index/total, así que la
    // primera pregunta mostraba siempre 0%.
    const { result } = setup();

    act(() => result.current.submit("uno"));

    expect(result.current.progress).toBe(20);
  });

  it("marca la última pregunta como tal", () => {
    const { result } = setup();

    for (const answer of ["uno", "dos", "tres", "cuatro"]) {
      act(() => result.current.submit(answer));
      act(() => result.current.next());
    }

    expect(result.current.isLastQuestion).toBe(true);
  });

  it("termina la ronda al avanzar desde la última pregunta", () => {
    const { result } = setup();

    for (const answer of ["uno", "dos", "tres", "cuatro", "cinco"]) {
      act(() => result.current.submit(answer));
      act(() => result.current.next());
    }

    expect(result.current.status).toBe(ROUND_STATUS.FINISHED);
    expect(result.current.progress).toBe(100);
    expect(result.current.correctCount).toBe(5);
  });

  it("no avanza si todavía no se respondió", () => {
    const { result } = setup();

    act(() => result.current.next());

    expect(result.current.index).toBe(0);
  });
});

describe("cambio de partida", () => {
  it("rearma la ronda cuando cambia roundKey", () => {
    // ESTE es el bug de la primera versión: `useState(buildRound)` corría
    // una sola vez, así que la prop `category` existía y no hacía nada.
    const { result, rerender } = setup();

    act(() => result.current.submit("uno"));
    expect(result.current.score).toBe(10);

    rerender({
      questions: OTHER_QUESTIONS,
      roundKey: "otra-categoria",
      scheduler: inOrder(),
    });

    expect(result.current.question?.id).toBe("otra1");
    expect(result.current.total).toBe(2);
    expect(result.current.score).toBe(0);
    expect(result.current.status).toBe(ROUND_STATUS.PLAYING);
  });

  it("no rearma nada si roundKey no cambió", () => {
    const { result, rerender } = setup();

    act(() => result.current.submit("uno"));
    rerender({ questions: QUESTIONS, roundKey: "todas", scheduler: inOrder() });

    expect(result.current.score).toBe(10);
    expect(result.current.status).toBe(ROUND_STATUS.ANSWERED);
  });

  it("restart limpia el marcador y los errores", () => {
    const { result } = setup();

    act(() => result.current.submit("mal"));
    act(() => result.current.restart());

    expect(result.current.score).toBe(0);
    expect(result.current.mistakes).toEqual([]);
    expect(result.current.index).toBe(0);
  });
});

describe("integración con el scheduler", () => {
  it("le informa cada resultado, acierto o error", () => {
    const log: Array<[string, boolean]> = [];
    const { result } = setup({ scheduler: inOrder(log) });

    act(() => result.current.submit("uno"));
    act(() => result.current.next());
    act(() => result.current.submit("mal"));

    expect(log).toEqual([
      ["q1", true],
      ["q2", false],
    ]);
  });

  it("no le informa una respuesta repetida a la misma pregunta", () => {
    const log: Array<[string, boolean]> = [];
    const { result } = setup({ scheduler: inOrder(log) });

    act(() => result.current.submit("uno"));
    act(() => result.current.submit("uno"));

    expect(log).toHaveLength(1);
  });
});

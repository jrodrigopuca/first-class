import { clsx } from "clsx";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useGameId } from "../../engine/gameIdentity";
import { ROUND_STATUS } from "../../engine/types";
import { useGameRound } from "../../engine/useGameRound";
import { useSpacedRepetition } from "../../engine/useSpacedRepetition";
import { toHref } from "../../lib/router";
import {
  Button,
  BUTTON_VARIANT,
  Feedback,
  FEEDBACK_TONE,
  GameCard,
  ProgressBar,
  ProgressSummary,
  ResultScreen,
  Scoreboard,
} from "../../engine/ui";
import {
  countWords,
  findSubmissionIssue,
  isCorrect,
  markAnswer,
  SUBMISSION_ISSUE,
  type Marking,
  type SubmissionIssue,
} from "./grading";
import { QUESTIONS } from "./questions";
import { groupIdOf } from "./review";
import {
  MARKS_PER_ITEM,
  MAX_WORDS,
  MIN_WORDS,
  TRANSFORMATION,
  type KeyWordQuestion,
  type Transformation,
} from "./types";
import styles from "./KeyWordTransformation.module.css";

/** Como en el examen: seis transformaciones por Part 4. */
const ROUND_LENGTH = 6;
const ALL = "all";
const STREAK_BONUS_FROM = 4;

type CategoryFilter = Transformation | typeof ALL;

const FILTER_LABELS: Record<CategoryFilter, string> = {
  [ALL]: "Todas",
  [TRANSFORMATION.PASSIVE]: "Pasiva",
  [TRANSFORMATION.REPORTED]: "Estilo indirecto",
  [TRANSFORMATION.CONDITIONAL]: "Condicionales",
  [TRANSFORMATION.COMPARATIVE]: "Comparativos",
  [TRANSFORMATION.MODAL]: "Modales",
  [TRANSFORMATION.VERB_PATTERN]: "Patrones verbales",
  [TRANSFORMATION.EXPRESSION]: "Expresiones",
  [TRANSFORMATION.PHRASAL]: "Phrasal verbs",
};

const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  ALL,
  TRANSFORMATION.PASSIVE,
  TRANSFORMATION.REPORTED,
  TRANSFORMATION.CONDITIONAL,
  TRANSFORMATION.COMPARATIVE,
  TRANSFORMATION.MODAL,
  TRANSFORMATION.VERB_PATTERN,
  TRANSFORMATION.EXPRESSION,
  TRANSFORMATION.PHRASAL,
];

function describeIssue(issue: SubmissionIssue, keyWord: string): string {
  switch (issue) {
    case SUBMISSION_ISSUE.EMPTY:
      return "Escribí una respuesta primero.";
    case SUBMISSION_ISSUE.TOO_FEW:
      return `Muy corta: hacen falta al menos ${MIN_WORDS} palabras.`;
    case SUBMISSION_ISSUE.TOO_MANY:
      return `Muy larga: el máximo son ${MAX_WORDS} palabras (las contracciones cuentan como dos).`;
    case SUBMISSION_ISSUE.MISSING_KEY_WORD:
      return `Falta la palabra clave ${keyWord}, y va tal cual, sin cambiarla.`;
  }
}

export function KeyWordTransformation() {
  const [filter, setFilter] = useState<CategoryFilter>(ALL);
  const [input, setInput] = useState("");
  const [issue, setIssue] = useState<SubmissionIssue | null>(null);
  /**
   * Puntos de examen (0–2) por pregunta de ESTA ronda. El motor no los
   * conoce: para él una respuesta es correcta o no. Se vacían en cada
   * punto donde el motor arma una ronda nueva (filtro y reinicio).
   */
  const [marks, setMarks] = useState<Readonly<Record<string, Marking>>>({});
  const gameId = useGameId();
  const inputRef = useRef<HTMLInputElement>(null);

  const pool =
    filter === ALL ? QUESTIONS : QUESTIONS.filter((question) => question.category === filter);

  const srs = useSpacedRepetition<KeyWordQuestion>();

  const round = useGameRound<KeyWordQuestion, string>({
    questions: pool,
    roundLength: ROUND_LENGTH,
    roundKey: filter,
    isCorrect,
    scheduler: srs.scheduler,
  });

  const { question, status } = round;

  useEffect(() => {
    if (status === ROUND_STATUS.PLAYING) inputRef.current?.focus();
  }, [round.index, status]);

  const changeFilter = (next: CategoryFilter) => {
    setFilter(next);
    setInput("");
    setIssue(null);
    setMarks({});
  };

  const check = () => {
    if (question === undefined) return;
    // Las reglas del examen se comprueban ANTES de puntuar. Pasarse de
    // cinco palabras no es fallar la gramática: es una respuesta inválida,
    // y no tiene por qué costarte la racha.
    const problem = findSubmissionIssue(question, input);
    if (problem !== null) {
      setIssue(problem);
      return;
    }
    setIssue(null);
    setMarks((prev) => ({ ...prev, [question.id]: markAnswer(question, input) }));
    round.submit(input);
  };

  const goNext = () => {
    setInput("");
    setIssue(null);
    round.next();
  };

  const restart = () => {
    setInput("");
    setIssue(null);
    setMarks({});
    round.restart();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (status === ROUND_STATUS.ANSWERED) goNext();
    else check();
  };

  const filterBar = (
    <div className={styles.filters} role="group" aria-label="Filtrar por transformación">
      {CATEGORY_FILTERS.map((value) => (
        <button
          key={value}
          type="button"
          aria-pressed={filter === value}
          onClick={() => changeFilter(value)}
          className={clsx(styles.filter, filter === value && styles.filterActive)}
        >
          {FILTER_LABELS[value]}
        </button>
      ))}
    </div>
  );

  if (round.isEmpty) {
    return (
      <div className={styles.game}>
        {filterBar}
        <GameCard>
          <p className={styles.empty}>
            No hay ítems de este tipo todavía. Sumá entradas a <code>questions.json</code>.
          </p>
        </GameCard>
      </div>
    );
  }

  const totalMarks = Object.values(marks).reduce((sum, marking) => sum + marking.marks, 0);
  const current = question === undefined ? undefined : marks[question.id];

  const words = countWords(input);
  const countIsBad = input.trim() !== "" && (words < MIN_WORDS || words > MAX_WORDS);

  return (
    <div className={styles.game}>
      {filterBar}

      <ProgressSummary summary={srs.summary(pool)} onReset={srs.reset} />

      <div>
        <Scoreboard
          score={round.score}
          streak={round.streak}
          current={status === ROUND_STATUS.FINISHED ? round.total : round.index + 1}
          total={round.total}
        />
        <ProgressBar value={round.progress} />
      </div>

      {status === ROUND_STATUS.FINISHED || question === undefined ? (
        <ResultScreen
          correctCount={round.correctCount}
          total={round.total}
          score={round.score}
          bestStreak={round.bestStreak}
          onRestart={restart}
          review={
            <>
              <p className={styles.examScore}>
                Puntaje de examen: <strong>{totalMarks} de {round.total * MARKS_PER_ITEM}</strong>
              </p>
              {round.mistakes.length > 0 && (
                <ul className={styles.reviewList}>
                  {round.mistakes.map((mistake) => (
                    <li key={mistake.id} className={styles.reviewItem}>
                      {mistake.gapped.replace("___", `«${mistake.answers[0]}»`)}
                      <br />
                      <span className={styles.reviewAnswer}>{mistake.keyWord}</span> · {mistake.label}
                      {" · "}
                      {marks[mistake.id]?.marks ?? 0} de {MARKS_PER_ITEM}
                    </li>
                  ))}
                </ul>
              )}
            </>
          }
        />
      ) : (
        <GameCard>
          <p className={styles.stepLabel}>Frase original</p>
          <p className={styles.original}>{question.original}</p>

          <div className={styles.keyRow}>
            <span className={styles.stepLabel}>Palabra clave:</span>
            <span className={styles.keyWord}>{question.keyWord}</span>
          </div>

          <p className={styles.stepLabel}>Completá con {MIN_WORDS} a {MAX_WORDS} palabras</p>
          <p className={styles.gapped}>
            <Gapped text={question.gapped} />
          </p>

          <div className={styles.inputRow}>
            <label htmlFor="kwt-input" className={styles.stepLabel}>
              Tu respuesta
            </label>
            <span className={clsx(styles.counter, countIsBad && styles.counterBad)}>
              {words} / {MIN_WORDS}–{MAX_WORDS} palabras
            </span>
          </div>
          <input
            id="kwt-input"
            ref={inputRef}
            className={styles.input}
            type="text"
            value={input}
            // readOnly y NO disabled: un input deshabilitado pierde el foco
            // y deja de recibir eventos de teclado, así que el Enter para
            // avanzar a la siguiente pregunta dejaba de funcionar. readOnly
            // bloquea la edición pero mantiene foco y teclado vivos.
            readOnly={status === ROUND_STATUS.ANSWERED}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            onChange={(event) => {
              setInput(event.target.value);
              setIssue(null);
            }}
            onKeyDown={handleKeyDown}
          />
          {issue !== null && (
            <p className={styles.warning}>{describeIssue(issue, question.keyWord)}</p>
          )}

          {status === ROUND_STATUS.ANSWERED && (
            <Feedback
              tone={round.wasCorrect ? FEEDBACK_TONE.SUCCESS : FEEDBACK_TONE.ERROR}
              title={
                round.wasCorrect
                  ? round.streak >= STREAK_BONUS_FROM
                    ? `¡Correcto! 2 de 2 · Racha x${round.streak} (+15)`
                    : "¡Correcto! 2 de 2 (+10)"
                  : `${current?.marks ?? 0} de ${MARKS_PER_ITEM} · La respuesta era: ${question.answers[0]}`
              }
            >
              {current !== undefined && !round.wasCorrect && <HalvesBreakdown marking={current} />}
              <span className={styles.tag}>{question.label}</span>
              {question.explanation}
              {question.answers.length > 1 && (
                <p className={styles.alternatives}>
                  También vale: {question.answers.slice(1).join(" · ")}
                </p>
              )}
              <a
                href={toHref(`/review/${gameId}/${groupIdOf(question)}`)}
                className={styles.reviewLink}
              >
                Ver toda la familia →
              </a>
            </Feedback>
          )}

          <div className={styles.actions}>
            <Button
              block
              variant={BUTTON_VARIANT.PRIMARY}
              onClick={status === ROUND_STATUS.ANSWERED ? goNext : check}
            >
              {status === ROUND_STATUS.ANSWERED
                ? round.isLastQuestion
                  ? "Ver resultado"
                  : "Siguiente"
                : "Comprobar"}
            </Button>
          </div>
        </GameCard>
      )}
    </div>
  );
}

function Gapped({ text }: { text: string }) {
  const [before = "", after = ""] = text.split("___");
  return (
    <>
      {before}
      <span className={styles.blank} aria-label="espacio en blanco" />
      {after}
    </>
  );
}

/**
 * Qué mitad estuvo bien y cuál no. Es lo que convierte "1 de 2" en algo
 * que se puede corregir: sabés si fallaste la estructura o el detalle.
 */
function HalvesBreakdown({ marking }: { marking: Marking }) {
  const [first, second] = marking.closest;
  // Las dos mitades bien y aun así 1 punto: sobra algo entre ellas. Sin
  // decirlo, dos ✓ con "1 de 2" parece un error del corrector.
  const extraWords = marking.firstHalf && marking.secondHalf;
  return (
    <>
      {extraWords && (
        <p className={styles.halvesNote}>
          Las dos partes están, pero sobran palabras entre ellas: un error en cualquier parte cuesta
          un punto.
        </p>
      )}
      <p className={styles.halves}>
        <span className={marking.firstHalf ? styles.halfOk : styles.halfBad}>
          {marking.firstHalf ? "✓" : "✗"} {first}
        </span>
        <span className={marking.secondHalf ? styles.halfOk : styles.halfBad}>
          {marking.secondHalf ? "✓" : "✗"} {second}
        </span>
      </p>
    </>
  );
}

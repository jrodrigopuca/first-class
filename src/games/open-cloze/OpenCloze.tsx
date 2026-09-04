import { clsx } from "clsx";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ROUND_STATUS } from "../../engine/types";
import { useGameRound } from "../../engine/useGameRound";
import { useSpacedRepetition } from "../../engine/useSpacedRepetition";
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
import { findSubmissionIssue, isCorrect, SUBMISSION_ISSUE, type SubmissionIssue } from "./grading";
import { QUESTIONS } from "./questions";
import { GAP_TYPE, type GapType, type OpenClozeQuestion } from "./types";
import styles from "./OpenCloze.module.css";

const ROUND_LENGTH = 12;
const ALL = "all";
const STREAK_BONUS_FROM = 4;

type CategoryFilter = GapType | typeof ALL;

const FILTER_LABELS: Record<CategoryFilter, string> = {
  [ALL]: "Todas",
  [GAP_TYPE.ARTICLE]: "Artículos",
  [GAP_TYPE.PREPOSITION]: "Preposiciones",
  [GAP_TYPE.AUXILIARY]: "Auxiliares",
  [GAP_TYPE.PRONOUN]: "Pronombres",
  [GAP_TYPE.QUANTIFIER]: "Cuantificadores",
  [GAP_TYPE.LINKER]: "Conectores",
  [GAP_TYPE.FIXED_PHRASE]: "Frases hechas",
  [GAP_TYPE.COMPARATIVE]: "Comparativos",
};

const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  ALL,
  GAP_TYPE.ARTICLE,
  GAP_TYPE.PREPOSITION,
  GAP_TYPE.AUXILIARY,
  GAP_TYPE.PRONOUN,
  GAP_TYPE.QUANTIFIER,
  GAP_TYPE.LINKER,
  GAP_TYPE.FIXED_PHRASE,
  GAP_TYPE.COMPARATIVE,
];

function describeIssue(issue: SubmissionIssue): string {
  switch (issue) {
    case SUBMISSION_ISSUE.EMPTY:
      return "Escribí una palabra primero.";
    case SUBMISSION_ISSUE.TOO_MANY:
      return "Solo UNA palabra por hueco. Ojo: una contracción como \"don't\" cuenta como dos.";
  }
}

export function OpenCloze() {
  const [filter, setFilter] = useState<CategoryFilter>(ALL);
  const [input, setInput] = useState("");
  const [issue, setIssue] = useState<SubmissionIssue | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pool =
    filter === ALL ? QUESTIONS : QUESTIONS.filter((question) => question.category === filter);

  const srs = useSpacedRepetition<OpenClozeQuestion>();

  const round = useGameRound<OpenClozeQuestion, string>({
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
  };

  const check = () => {
    // Las reglas del examen se comprueban antes de puntuar: escribir dos
    // palabras no es equivocarse de gramática, es una jugada inválida.
    const problem = findSubmissionIssue(input);
    if (problem !== null) {
      setIssue(problem);
      return;
    }
    setIssue(null);
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
    round.restart();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (status === ROUND_STATUS.ANSWERED) goNext();
    else check();
  };

  const filterBar = (
    <div className={styles.filters} role="group" aria-label="Filtrar por tipo de palabra">
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
            No hay preguntas de este tipo todavía. Sumá entradas a <code>questions.json</code>.
          </p>
        </GameCard>
      </div>
    );
  }

  const answered = status === ROUND_STATUS.ANSWERED;

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
            round.mistakes.length > 0 ? (
              <ul className={styles.reviewList}>
                {round.mistakes.map((mistake) => (
                  <li key={mistake.id} className={styles.reviewItem}>
                    {mistake.sentence.replace("___", `«${mistake.answers[0]}»`)}
                    <br />
                    <span className={styles.reviewAnswer}>{mistake.label}</span>
                  </li>
                ))}
              </ul>
            ) : undefined
          }
        />
      ) : (
        <GameCard>
          <p className={styles.sentence}>
            <Sentence text={question.sentence} filledWith={answered ? question.answers[0] : null} />
          </p>

          <label htmlFor="open-cloze-input" className={styles.label}>
            Escribí UNA sola palabra
          </label>
          <input
            id="open-cloze-input"
            ref={inputRef}
            className={styles.input}
            type="text"
            value={input}
            readOnly={answered}
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
          {issue !== null && <p className={styles.warning}>{describeIssue(issue)}</p>}

          {answered && (
            <Feedback
              tone={round.wasCorrect ? FEEDBACK_TONE.SUCCESS : FEEDBACK_TONE.ERROR}
              title={
                round.wasCorrect
                  ? round.streak >= STREAK_BONUS_FROM
                    ? `¡Correcto! Racha x${round.streak} (+15)`
                    : "¡Correcto! (+10)"
                  : `La respuesta era: ${question.answers[0]}`
              }
            >
              <span className={styles.tag}>{question.label}</span>
              {question.explanation}
              {question.answers.length > 1 && (
                <p className={styles.alternatives}>
                  También vale: {question.answers.slice(1).join(" · ")}
                </p>
              )}
            </Feedback>
          )}

          <div className={styles.actions}>
            <Button block variant={BUTTON_VARIANT.PRIMARY} onClick={answered ? goNext : check}>
              {answered ? (round.isLastQuestion ? "Ver resultado" : "Siguiente") : "Comprobar"}
            </Button>
          </div>
        </GameCard>
      )}
    </div>
  );
}

function Sentence({ text, filledWith }: { text: string; filledWith: string | undefined | null }) {
  const [before = "", after = ""] = text.split("___");
  return (
    <>
      {before}
      <span className={clsx(styles.blank, filledWith != null && styles.blankFilled)}>
        {filledWith ?? ""}
      </span>
      {after}
    </>
  );
}

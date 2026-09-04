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
import { QUESTIONS } from "./questions";
import { WORD_CATEGORY, type WordCategory, type WordFormationQuestion } from "./types";
import styles from "./WordFormationGame.module.css";

const ROUND_LENGTH = 15;
const ALL_CATEGORIES = "all";
const STREAK_BONUS_FROM = 4;

type CategoryFilter = WordCategory | typeof ALL_CATEGORIES;

const FILTER_LABELS: Record<CategoryFilter, string> = {
  [ALL_CATEGORIES]: "Todas",
  [WORD_CATEGORY.NOUN]: "Sustantivos",
  [WORD_CATEGORY.ADJECTIVE]: "Adjetivos",
  [WORD_CATEGORY.ADVERB]: "Adverbios",
  [WORD_CATEGORY.VERB]: "Verbos",
  [WORD_CATEGORY.PERSON]: "Personas",
  [WORD_CATEGORY.PREFIX]: "Prefijos",
};

const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  ALL_CATEGORIES,
  WORD_CATEGORY.NOUN,
  WORD_CATEGORY.ADJECTIVE,
  WORD_CATEGORY.ADVERB,
  WORD_CATEGORY.VERB,
  WORD_CATEGORY.PERSON,
  WORD_CATEGORY.PREFIX,
];

/** Colapsa espacios y baja a minúscula: "  Construction " -> "construction". */
function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function checkAnswer(question: WordFormationQuestion, answer: string): boolean {
  return question.answers.includes(normalize(answer));
}

export function WordFormationGame() {
  const [filter, setFilter] = useState<CategoryFilter>(ALL_CATEGORIES);
  const [input, setInput] = useState("");
  const [showEmptyWarning, setShowEmptyWarning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sin useMemo: el React Compiler memoiza esto solo.
  const pool =
    filter === ALL_CATEGORIES
      ? QUESTIONS
      : QUESTIONS.filter((question) => question.category === filter);

  const srs = useSpacedRepetition<WordFormationQuestion>();

  const round = useGameRound<WordFormationQuestion, string>({
    questions: pool,
    roundLength: ROUND_LENGTH,
    // Cambiar de filtro arma una ronda nueva. En el componente viejo
    // la prop `category` existía pero no hacía nada.
    roundKey: filter,
    isCorrect: checkAnswer,
    scheduler: srs.scheduler,
  });

  const { question, status } = round;

  useEffect(() => {
    if (status === ROUND_STATUS.PLAYING) inputRef.current?.focus();
  }, [round.index, status]);

  const changeFilter = (next: CategoryFilter) => {
    setFilter(next);
    setInput("");
    setShowEmptyWarning(false);
  };

  const check = () => {
    if (normalize(input) === "") {
      setShowEmptyWarning(true);
      return;
    }
    setShowEmptyWarning(false);
    round.submit(input);
  };

  const goNext = () => {
    setInput("");
    round.next();
  };

  const restart = () => {
    setInput("");
    setShowEmptyWarning(false);
    round.restart();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (status === ROUND_STATUS.ANSWERED) goNext();
    else check();
  };

  const filterBar = (
    <div className={styles.filters} role="group" aria-label="Filtrar por categoría">
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
            No hay preguntas en esta categoría todavía. Sumá entradas a{" "}
            <code>questions.json</code>.
          </p>
        </GameCard>
      </div>
    );
  }

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
                    {mistake.root} →{" "}
                    <span className={styles.reviewAnswer}>{mistake.answers[0]}</span> ·{" "}
                    {mistake.label}
                  </li>
                ))}
              </ul>
            ) : undefined
          }
        />
      ) : (
        <GameCard>
          <p className={styles.sentence}>
            <Sentence text={question.sentence} />
          </p>

          <div className={styles.rootRow}>
            <span className={styles.rootLabel}>Palabra raíz:</span>
            <span className={styles.root}>{question.root}</span>
          </div>

          <label htmlFor="word-formation-input" className={styles.rootLabel}>
            Escribí la forma correcta
          </label>
          <input
            id="word-formation-input"
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
              setShowEmptyWarning(false);
            }}
            onKeyDown={handleKeyDown}
          />
          {showEmptyWarning && <p className={styles.warning}>Escribí una respuesta primero.</p>}

          {status === ROUND_STATUS.ANSWERED && (
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

/** Pinta la frase con el hueco como una línea, no como tres guiones bajos. */
function Sentence({ text }: { text: string }) {
  const [before = "", after = ""] = text.split("___");
  return (
    <>
      {before}
      <span className={styles.blank} aria-label="espacio en blanco" />
      {after}
    </>
  );
}

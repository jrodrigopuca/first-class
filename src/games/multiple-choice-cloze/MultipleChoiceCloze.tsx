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
import { buildOptions, isCorrect } from "./options";
import { QUESTIONS } from "./questions";
import { CLOZE_TYPE, type ClozeQuestion, type ClozeType } from "./types";
import styles from "./MultipleChoiceCloze.module.css";

const ROUND_LENGTH = 12;
const ALL = "all";
const STREAK_BONUS_FROM = 4;

type CategoryFilter = ClozeType | typeof ALL;

const FILTER_LABELS: Record<CategoryFilter, string> = {
  [ALL]: "Todas",
  [CLOZE_TYPE.COLLOCATION]: "Colocaciones",
  [CLOZE_TYPE.PHRASAL]: "Phrasal verbs",
  [CLOZE_TYPE.PREPOSITION]: "Preposiciones",
  [CLOZE_TYPE.LINKER]: "Conectores",
  [CLOZE_TYPE.CONFUSABLE]: "Confundibles",
};

const CATEGORY_FILTERS: readonly CategoryFilter[] = [
  ALL,
  CLOZE_TYPE.COLLOCATION,
  CLOZE_TYPE.PHRASAL,
  CLOZE_TYPE.PREPOSITION,
  CLOZE_TYPE.LINKER,
  CLOZE_TYPE.CONFUSABLE,
];

export function MultipleChoiceCloze() {
  const [filter, setFilter] = useState<CategoryFilter>(ALL);
  const [selected, setSelected] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const pool =
    filter === ALL ? QUESTIONS : QUESTIONS.filter((question) => question.category === filter);

  const srs = useSpacedRepetition<ClozeQuestion>();

  const round = useGameRound<ClozeQuestion, string>({
    questions: pool,
    roundLength: ROUND_LENGTH,
    roundKey: filter,
    isCorrect,
    scheduler: srs.scheduler,
  });

  const { question, status } = round;

  /*
   * Las opciones se barajan UNA vez por pregunta, no en cada render.
   *
   * Es el mismo patrón de "ajustar estado durante el render" que usa el
   * motor cuando cambia roundKey. Si barajáramos en el cuerpo del
   * componente sin memoria, las opciones saltarían de lugar con cada
   * tecla que tocás.
   */
  const [optionsFor, setOptionsFor] = useState<string | undefined>(question?.id);
  const [options, setOptions] = useState<readonly string[]>(() =>
    question === undefined ? [] : buildOptions(question),
  );

  if (question !== undefined && question.id !== optionsFor) {
    setOptionsFor(question.id);
    setOptions(buildOptions(question));
  }

  // El foco vive en la tarjeta, no en un input: este juego se maneja con
  // las teclas 1-4 y Enter, así que el contenedor tiene que ser focusable.
  useEffect(() => {
    cardRef.current?.focus();
  }, [round.index, status]);

  const changeFilter = (next: CategoryFilter) => {
    setFilter(next);
    setSelected(null);
    setShowWarning(false);
  };

  const choose = (option: string) => {
    if (status !== ROUND_STATUS.PLAYING) return;
    setSelected(option);
    setShowWarning(false);
  };

  const check = () => {
    if (selected === null) {
      setShowWarning(true);
      return;
    }
    setShowWarning(false);
    round.submit(selected);
  };

  const goNext = () => {
    setSelected(null);
    setShowWarning(false);
    round.next();
  };

  const restart = () => {
    setSelected(null);
    setShowWarning(false);
    round.restart();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (status === ROUND_STATUS.ANSWERED) goNext();
      else check();
      return;
    }

    const digit = Number(event.key);
    if (Number.isInteger(digit) && digit >= 1 && digit <= options.length) {
      event.preventDefault();
      const option = options[digit - 1];
      if (option !== undefined) choose(option);
    }
  };

  const filterBar = (
    <div className={styles.filters} role="group" aria-label="Filtrar por tipo">
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
            No hay preguntas de este tipo todavía. Sumá entradas a{" "}
            <code>questions.json</code>.
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
                    {mistake.sentence.replace("___", `«${mistake.answer}»`)}
                    <br />
                    <span className={styles.reviewAnswer}>{mistake.label}</span>
                  </li>
                ))}
              </ul>
            ) : undefined
          }
        />
      ) : (
        // tabIndex en el contenedor: sin input de texto, el teclado
        // necesita un lugar donde vivir.
        <div ref={cardRef} tabIndex={-1} onKeyDown={handleKeyDown}>
          <GameCard>
            <p className={styles.sentence}>
              <Sentence text={question.sentence} filledWith={answered ? question.answer : selected} />
            </p>

            <div className={styles.options} role="group" aria-label="Opciones">
              {options.map((option, position) => (
                <button
                  key={option}
                  type="button"
                  disabled={answered}
                  aria-pressed={selected === option}
                  onClick={() => choose(option)}
                  className={clsx(
                    styles.option,
                    !answered && selected === option && styles.optionSelected,
                    answered && option === question.answer && styles.optionCorrect,
                    answered && selected === option && option !== question.answer && styles.optionWrong,
                  )}
                >
                  <span className={styles.shortcut}>{position + 1}</span>
                  {option}
                </button>
              ))}
            </div>

            {showWarning && <p className={styles.warning}>Elegí una opción primero.</p>}
            {!answered && !showWarning && (
              <p className={styles.hint}>Teclas 1–4 para elegir · Enter para comprobar</p>
            )}

            {answered && (
              <Feedback
                tone={round.wasCorrect ? FEEDBACK_TONE.SUCCESS : FEEDBACK_TONE.ERROR}
                title={
                  round.wasCorrect
                    ? round.streak >= STREAK_BONUS_FROM
                      ? `¡Correcto! Racha x${round.streak} (+15)`
                      : "¡Correcto! (+10)"
                    : `La respuesta era: ${question.answer}`
                }
              >
                <span className={styles.tag}>{question.label}</span>
                {question.explanation}
              </Feedback>
            )}

            <div className={styles.actions}>
              <Button block variant={BUTTON_VARIANT.PRIMARY} onClick={answered ? goNext : check}>
                {answered ? (round.isLastQuestion ? "Ver resultado" : "Siguiente") : "Comprobar"}
              </Button>
            </div>
          </GameCard>
        </div>
      )}
    </div>
  );
}

function Sentence({ text, filledWith }: { text: string; filledWith: string | null }) {
  const [before = "", after = ""] = text.split("___");
  return (
    <>
      {before}
      <span className={clsx(styles.blank, filledWith !== null && styles.blankFilled)}>
        {filledWith ?? ""}
      </span>
      {after}
    </>
  );
}

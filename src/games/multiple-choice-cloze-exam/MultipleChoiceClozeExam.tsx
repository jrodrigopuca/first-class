import { clsx } from "clsx";
import { useId, useRef, useState } from "react";
import { useGameId } from "../../engine/gameIdentity";
import { Button, BUTTON_VARIANT, ExamText, GameCard, GapNumber, ScoreBanner } from "../../engine/ui";
import { toHref } from "../../lib/router";
import { buildPaper, grade, pickText, type Paper, type PaperGap } from "./paper";
import { groupIdOf } from "./review";
import { TEXTS } from "./texts";
import styles from "./MultipleChoiceClozeExam.module.css";

const LETTERS = ["A", "B", "C", "D"] as const;

/**
 * Part 1 en formato examen: el texto entero, el ejemplo (0) y ocho huecos.
 *
 * No usa el motor de rondas ni la repetición espaciada, a propósito
 * (decisión #17): en el examen respondés todo en el orden que quieras y
 * corregís al final, y eso no es un ciclo pregunta → feedback → siguiente.
 */
export function MultipleChoiceClozeExam() {
  const gameId = useGameId();
  const idPrefix = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper>(() => buildPaper(pickText(TEXTS)));
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [checked, setChecked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const byIndex = new Map(paper.gaps.map((paperGap) => [paperGap.index, paperGap]));
  const missing = paper.gaps.filter((paperGap) => answers[paperGap.gap.id] === undefined);
  const result = checked ? grade(paper, answers) : undefined;
  const correctById = new Map(result?.results.map((r) => [r.paperGap.gap.id, r.correct]));

  const rowId = (number: number) => `${idPrefix}-gap-${number}`;

  const choose = (gapId: string, option: string) => {
    // Corregido, el examen queda congelado. No se usa `disabled` en los
    // radios: sacaría el foco del teclado y no dejaría leer con Tab.
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [gapId]: option }));
    setShowWarning(false);
  };

  const goToGap = (number: number) => {
    const row = document.getElementById(rowId(number));
    const input = row?.querySelector<HTMLInputElement>("input:checked") ?? row?.querySelector("input");
    input?.focus({ preventScroll: true });
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const check = () => {
    if (missing.length > 0) {
      // Validar ANTES de corregir: un hueco vacío no es un error de
      // vocabulario. Y en el examen no se resta, así que siempre conviene
      // responder.
      setShowWarning(true);
      const first = missing[0];
      if (first !== undefined) goToGap(first.number);
      return;
    }
    setChecked(true);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultRef.current?.focus({ preventScroll: true });
    });
  };

  const start = (next: Paper) => {
    setPaper(next);
    setAnswers({});
    setChecked(false);
    setShowWarning(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.game}>
      <p className={styles.instructions}>
        Leé el texto y elegí la opción que mejor completa cada espacio. Hay un ejemplo al
        principio (0). Respondé en el orden que quieras y corregí al final.
      </p>

      {result !== undefined && (
        <ScoreBanner ref={resultRef} correct={result.correct} total={result.total} />
      )}

      <GameCard>
        <ExamText
          title={paper.text.title}
          paragraphs={paper.text.paragraphs}
          renderGap={(index) => {
            if (index === 0) {
              return (
                <span className={styles.example}>
                  <GapNumber number={0} />
                  {paper.example.gap.answer}
                </span>
              );
            }

            const paperGap = byIndex.get(index);
            // Un candidato que esta vez no salió se lee como texto común.
            if (paperGap === undefined) return paper.text.gaps[index]?.answer;

            const chosen = answers[paperGap.gap.id];
            const correct = correctById.get(paperGap.gap.id);
            return (
              <button
                type="button"
                onClick={() => goToGap(paperGap.number)}
                aria-label={`Espacio ${paperGap.number}${chosen === undefined ? ", sin responder" : `: ${chosen}`}`}
                className={clsx(
                  styles.gap,
                  chosen !== undefined && styles.gapFilled,
                  correct === true && styles.gapCorrect,
                  correct === false && styles.gapWrong,
                )}
              >
                <GapNumber number={paperGap.number} />
                {chosen ?? " "}
              </button>
            );
          }}
        />
      </GameCard>

      <GameCard>
        <div className={styles.sheet}>
          <ExampleRow paperGap={paper.example} />
          {paper.gaps.map((paperGap) => (
            <GapRow
              key={paperGap.gap.id}
              id={rowId(paperGap.number)}
              name={`${idPrefix}-${paperGap.number}`}
              paperGap={paperGap}
              chosen={answers[paperGap.gap.id]}
              checked={checked}
              reviewHref={toHref(`/review/${gameId}/${groupIdOf(paperGap.gap)}`)}
              onChoose={(option) => choose(paperGap.gap.id, option)}
            />
          ))}
        </div>

        {showWarning && (
          <p className={styles.warning} role="alert">
            {missing.length === 1
              ? "Te falta 1 espacio. En el examen no se resta: respondé siempre."
              : `Te faltan ${missing.length} espacios. En el examen no se resta: respondé siempre.`}
          </p>
        )}

        <div className={styles.actions}>
          {checked ? (
            <>
              <Button variant={BUTTON_VARIANT.PRIMARY} onClick={() => start(buildPaper(pickText(TEXTS, paper.text.id)))}>
                Otro texto
              </Button>
              <Button variant={BUTTON_VARIANT.GHOST} onClick={() => start(buildPaper(paper.text))}>
                Mismo texto, otros espacios
              </Button>
            </>
          ) : (
            <Button block variant={BUTTON_VARIANT.PRIMARY} onClick={check}>
              Corregir
            </Button>
          )}
        </div>
      </GameCard>
    </div>
  );
}

function ExampleRow({ paperGap }: { paperGap: PaperGap }) {
  return (
    <div className={clsx(styles.row, styles.rowExample)}>
      <span className={styles.rowNumber}>0</span>
      <div className={styles.choices}>
        {paperGap.options.map((option, i) => (
          <span
            key={option}
            className={clsx(styles.choice, option === paperGap.gap.answer && styles.choiceSelected)}
          >
            <span className={styles.letter}>{LETTERS[i]}</span>
            {option}
          </span>
        ))}
      </div>
    </div>
  );
}

interface GapRowProps {
  id: string;
  name: string;
  paperGap: PaperGap;
  chosen: string | undefined;
  checked: boolean;
  reviewHref: string;
  onChoose: (option: string) => void;
}

function GapRow({ id, name, paperGap, chosen, checked, reviewHref, onChoose }: GapRowProps) {
  const { gap, number, options } = paperGap;
  const correct = chosen === gap.answer;

  return (
    <fieldset id={id} className={clsx(styles.row, checked && (correct ? styles.rowCorrect : styles.rowWrong))}>
      <legend className={styles.rowNumber}>
        <span className={styles.visuallyHidden}>Espacio </span>
        {number}
      </legend>

      <div className={styles.choices}>
        {options.map((option, i) => (
          <label
            key={option}
            className={clsx(
              styles.choice,
              !checked && chosen === option && styles.choiceSelected,
              checked && option === gap.answer && styles.choiceCorrect,
              checked && chosen === option && !correct && styles.choiceWrong,
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={chosen === option}
              onChange={() => onChoose(option)}
              aria-readonly={checked}
              className={styles.radio}
            />
            <span className={styles.letter}>{LETTERS[i]}</span>
            {option}
          </label>
        ))}
      </div>

      {checked && (
        <div className={styles.explanation}>
          <p className={styles.verdict}>
            {correct ? "✓ Correcto" : `✗ Era «${gap.answer}»`}
            <span className={styles.label}>{gap.label}</span>
          </p>
          <p className={styles.explanationText}>{gap.explanation}</p>
          {!correct && (
            <a href={reviewHref} className={styles.reviewLink}>
              Repasar este tipo →
            </a>
          )}
        </div>
      )}
    </fieldset>
  );
}

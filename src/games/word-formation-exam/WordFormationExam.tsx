import { clsx } from "clsx";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { useGameId } from "../../engine/gameIdentity";
import { Button, BUTTON_VARIANT, ExamText, GameCard, GapNumber, ScoreBanner } from "../../engine/ui";
import { normalize } from "../../exam/text";
import { toHref } from "../../lib/router";
import {
  buildPaper,
  findIssue,
  grade,
  isCorrect,
  pickText,
  SUBMISSION_ISSUE,
  type Paper,
  type SubmissionIssue,
} from "./paper";
import { groupIdOf } from "./review";
import { TEXTS } from "./texts";
import styles from "./WordFormationExam.module.css";

const ISSUE_TEXT: Record<SubmissionIssue, string> = {
  [SUBMISSION_ISSUE.EMPTY]: "sin responder",
  [SUBMISSION_ISSUE.TOO_MANY]: "va UNA sola palabra",
  [SUBMISSION_ISSUE.UNCHANGED]: "copiaste la raíz: hay que transformarla",
};

/**
 * Part 3 en formato examen: el texto entero con ocho huecos y la raíz en
 * mayúsculas al lado de cada uno. Respondés en cualquier orden y corregís
 * al final, así que no usa el motor de rondas (decisión #17).
 *
 * En la hoja real la raíz va al final de la línea del hueco. En pantalla
 * el largo de línea cambia con el ancho, así que va pegada al hueco.
 */
export function WordFormationExam() {
  const gameId = useGameId();
  const idPrefix = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper>(() => buildPaper(pickText(TEXTS)));
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [checked, setChecked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const byIndex = new Map(paper.gaps.map((paperGap) => [paperGap.index, paperGap]));
  const issues = paper.gaps.flatMap((paperGap) => {
    const issue = findIssue(paperGap.gap, answers[paperGap.gap.id]);
    return issue === null ? [] : [{ paperGap, issue }];
  });
  const issueById = new Map(issues.map(({ paperGap, issue }) => [paperGap.gap.id, issue]));
  const result = checked ? grade(paper, answers) : undefined;

  const inputId = (number: number) => `${idPrefix}-gap-${number}`;
  const focusGap = (number: number) => document.getElementById(inputId(number))?.focus();

  const write = (gapId: string, value: string) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [gapId]: value }));
  };

  const check = () => {
    const first = issues[0];
    if (first !== undefined) {
      // Validar ANTES de corregir: vacío o dos palabras no es un error de
      // gramática. No cuesta puntos, te avisa.
      setShowIssues(true);
      focusGap(first.paperGap.number);
      return;
    }
    setChecked(true);
    requestAnimationFrame(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      resultRef.current?.focus({ preventScroll: true });
    });
  };

  const handleKeyDown = (number: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (checked) return;
    if (number < paper.gaps.length) focusGap(number + 1);
    else check();
  };

  const start = (next: Paper) => {
    setPaper(next);
    setAnswers({});
    setChecked(false);
    setShowIssues(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.game}>
      <p className={styles.instructions}>
        Transformá la palabra en MAYÚSCULAS para que encaje en el espacio. Hay un ejemplo al
        principio (0). Enter pasa al espacio siguiente; en el último, corrige.
      </p>

      {result !== undefined && <ScoreBanner ref={resultRef} correct={result.correct} total={result.total} />}

      <GameCard>
        <ExamText
          title={paper.text.title}
          paragraphs={paper.text.paragraphs}
          renderGap={(index) => {
            if (index === 0) {
              return (
                <span className={styles.example}>
                  <GapNumber number={0} />
                  {paper.example.gap.answers[0]}
                  <span className={styles.root}>{paper.example.gap.root}</span>
                </span>
              );
            }

            const paperGap = byIndex.get(index);
            // Un candidato que esta vez no salió se lee como texto común.
            if (paperGap === undefined) return paper.text.gaps[index]?.answers[0];

            const { gap, number } = paperGap;
            const value = answers[gap.id] ?? "";
            const correct = checked ? isCorrect(gap, value) : undefined;
            const invalid = showIssues && !checked && issueById.has(gap.id);

            return (
              <span className={styles.gap}>
                <GapNumber number={number} />
                <input
                  id={inputId(number)}
                  type="text"
                  value={value}
                  onChange={(event) => write(gap.id, event.target.value)}
                  onKeyDown={handleKeyDown(number)}
                  // readOnly y no disabled: disabled saca el input del
                  // orden de Tab y no deja recorrer el texto corregido.
                  readOnly={checked}
                  aria-label={`Espacio ${number}, a partir de ${gap.root}`}
                  aria-invalid={invalid || correct === false}
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={clsx(
                    styles.input,
                    invalid && styles.inputInvalid,
                    correct === true && styles.inputCorrect,
                    correct === false && styles.inputWrong,
                  )}
                />
                {correct === false && <span className={styles.fix}>{gap.answers[0]}</span>}
                <span className={styles.root} aria-hidden="true">
                  {gap.root}
                </span>
              </span>
            );
          }}
        />
      </GameCard>

      <GameCard>
        {checked ? (
          <ol className={styles.explanations}>
            {paper.gaps.map(({ gap, number }) => {
              const written = (answers[gap.id] ?? "").trim();
              const correct = isCorrect(gap, written);
              // Las otras respuestas que también valían: se aprende tanto
              // como de la correcta.
              const alternatives = correct
                ? gap.answers.filter((answer) => answer !== normalize(written))
                : gap.answers.slice(1);
              return (
                <li key={gap.id} className={clsx(styles.row, correct ? styles.rowCorrect : styles.rowWrong)}>
                  <span className={styles.rowNumber}>{number}</span>
                  <div>
                    <p className={styles.verdict}>
                      {correct ? `✓ «${written}»` : `✗ Escribiste «${written}» · Era «${gap.answers[0]}»`}
                      {alternatives.length > 0 && (
                        <span className={styles.also}> · también: {alternatives.join(", ")}</span>
                      )}
                      <span className={styles.label}>
                        {gap.root} · {gap.label}
                      </span>
                    </p>
                    <p className={styles.explanationText}>{gap.explanation}</p>
                    {!correct && (
                      <a href={toHref(`/review/${gameId}/${groupIdOf(gap)}`)} className={styles.reviewLink}>
                        Repasar este tipo →
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          showIssues &&
          issues.length > 0 && (
            <ul className={styles.issues} role="alert">
              {issues.map(({ paperGap, issue }) => (
                <li key={paperGap.gap.id}>
                  <button type="button" className={styles.issueLink} onClick={() => focusGap(paperGap.number)}>
                    Espacio {paperGap.number}
                  </button>
                  : {ISSUE_TEXT[issue]}
                </li>
              ))}
            </ul>
          )
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

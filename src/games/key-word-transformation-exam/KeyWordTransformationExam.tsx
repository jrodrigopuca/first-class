import { clsx } from "clsx";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button, BUTTON_VARIANT, GameCard, GapNumber, ScoreBanner } from "../../engine/ui";
import {
  findSubmissionIssue,
  MARKS_PER_ITEM,
  MAX_WORDS,
  MIN_WORDS,
  SUBMISSION_ISSUE,
  type Marking,
  type SubmissionIssue,
} from "../../exam/keyWord";
import { countWords } from "../../exam/text";
import { buildPaper, grade } from "./paper";
import { ITEMS } from "./questions";
import type { KeyWordItem } from "./types";
import styles from "./KeyWordTransformationExam.module.css";

function describeIssue(issue: SubmissionIssue, keyWord: string): string {
  switch (issue) {
    case SUBMISSION_ISSUE.EMPTY:
      return "sin responder";
    case SUBMISSION_ISSUE.TOO_FEW:
      return `muy corta: van al menos ${MIN_WORDS} palabras`;
    case SUBMISSION_ISSUE.TOO_MANY:
      return `muy larga: el máximo son ${MAX_WORDS} palabras (las contracciones cuentan como dos)`;
    case SUBMISSION_ISSUE.MISSING_KEY_WORD:
      return `falta ${keyWord}, y va tal cual, sin cambiarla`;
  }
}

/**
 * Part 4 en formato examen: seis transformaciones en la misma hoja.
 * Respondés en el orden que quieras y corregís al final, con 0–2 puntos
 * por ítem como en el examen.
 *
 * Es la versión de PRÁCTICA: sin repetición espaciada ni repaso
 * (decisión #17). La de aprender es la pre-práctica del Part 4, con su
 * propio set de frases.
 */
export function KeyWordTransformationExam() {
  const idPrefix = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<readonly KeyWordItem[]>(() => buildPaper(ITEMS));
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [checked, setChecked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const issues = paper.flatMap((item, i) => {
    const issue = findSubmissionIssue(item.keyWord, answers[item.id] ?? "");
    return issue === null ? [] : [{ item, number: i + 1, issue }];
  });
  const issueById = new Map(issues.map(({ item, issue }) => [item.id, issue]));
  const result = checked ? grade(paper, answers) : undefined;

  const inputId = (number: number) => `${idPrefix}-item-${number}`;
  const focusItem = (number: number) => document.getElementById(inputId(number))?.focus();

  const write = (itemId: string, value: string) => {
    if (checked) return;
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  };

  const check = () => {
    const first = issues[0];
    if (first !== undefined) {
      // Validar ANTES de corregir: una respuesta de seis palabras o sin la
      // clave no es un error de gramática, es una respuesta inválida.
      setShowIssues(true);
      focusItem(first.number);
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
    if (number < paper.length) focusItem(number + 1);
    else check();
  };

  const nextPaper = () => {
    setPaper(buildPaper(ITEMS, paper));
    setAnswers({});
    setChecked(false);
    setShowIssues(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className={styles.game}>
      <p className={styles.instructions}>
        Completá la segunda frase para que signifique lo mismo que la primera, usando la palabra
        clave sin cambiarla y entre {MIN_WORDS} y {MAX_WORDS} palabras. Cada frase vale{" "}
        {MARKS_PER_ITEM} puntos. Enter pasa a la siguiente; en la última, corrige.
      </p>

      {result !== undefined && <ScoreBanner ref={resultRef} correct={result.marks} total={result.total} />}

      <GameCard>
        <ol className={styles.items}>
          {paper.map((item, i) => {
            const number = i + 1;
            const value = answers[item.id] ?? "";
            const words = countWords(value);
            const issue = issueById.get(item.id);
            const marking = result?.byId.get(item.id);
            const [before = "", after = ""] = item.gapped.split("___");

            return (
              <li
                key={item.id}
                className={clsx(
                  styles.item,
                  marking?.marks === MARKS_PER_ITEM && styles.itemFull,
                  marking !== undefined && marking.marks < MARKS_PER_ITEM && styles.itemPartial,
                )}
              >
                <div className={styles.head}>
                  <GapNumber number={number} />
                  <p className={styles.original}>{item.original}</p>
                </div>

                <span className={styles.keyWord}>{item.keyWord}</span>

                <p className={styles.gapped}>
                  {before}
                  <input
                    id={inputId(number)}
                    type="text"
                    value={value}
                    onChange={(event) => write(item.id, event.target.value)}
                    onKeyDown={handleKeyDown(number)}
                    // readOnly y no disabled: disabled saca el input del
                    // orden de Tab y no deja recorrer la hoja corregida.
                    readOnly={checked}
                    aria-label={`Frase ${number}, con la palabra clave ${item.keyWord}`}
                    aria-invalid={showIssues && !checked && issue !== undefined}
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    className={clsx(styles.input, showIssues && !checked && issue !== undefined && styles.inputInvalid)}
                  />
                  {after}
                </p>

                {!checked && (
                  <p
                    className={clsx(
                      styles.counter,
                      value.trim() !== "" && (words < MIN_WORDS || words > MAX_WORDS) && styles.counterBad,
                    )}
                  >
                    {words} / {MIN_WORDS}–{MAX_WORDS} palabras
                    {showIssues && issue !== undefined && (
                      <span className={styles.issue}> · {describeIssue(issue, item.keyWord)}</span>
                    )}
                  </p>
                )}

                {marking !== undefined && <ItemFeedback item={item} marking={marking} />}
              </li>
            );
          })}
        </ol>

        <div className={styles.actions}>
          {checked ? (
            <Button variant={BUTTON_VARIANT.PRIMARY} onClick={nextPaper}>
              Otras seis frases
            </Button>
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

function ItemFeedback({ item, marking }: { item: KeyWordItem; marking: Marking }) {
  const full = marking.marks === MARKS_PER_ITEM;
  const [first, second] = marking.closest;
  const alternatives = item.answers.filter((answer) => answer !== `${first} ${second}`);

  return (
    <div className={styles.feedback}>
      <p className={styles.verdict}>
        {marking.marks} de {MARKS_PER_ITEM}
        <span className={styles.label}>{item.label}</span>
      </p>

      {!full && (
        <>
          {marking.firstHalf && marking.secondHalf && (
            <p className={styles.note}>
              Las dos partes están, pero sobran palabras entre ellas: un error en cualquier parte
              cuesta un punto.
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
      )}

      {alternatives.length > 0 && <p className={styles.note}>También vale: {alternatives.join(" · ")}</p>}
      <p className={styles.explanation}>{item.explanation}</p>
    </div>
  );
}

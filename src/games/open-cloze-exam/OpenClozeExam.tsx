import { useId, useRef, useState, type KeyboardEvent } from "react";
import {
  ActionBar,
  BarCount,
  BarRow,
  BarStack,
  BarWarning,
  Button,
  BUTTON_VARIANT,
  CorrectionRow,
  CorrectionSheet,
  ExamText,
  GameCard,
  GapChip,
  gapFieldClass,
  GapFix,
  GapNumber,
  gapStyles,
  GapTick,
  Handwritten,
  Pencil,
  Rubric,
  ScoreBanner,
  Struck,
} from "../../engine/ui";
import { normalize } from "../../exam/text";
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
import { TEXTS } from "./texts";
import styles from "./OpenClozeExam.module.css";

const ISSUE_TEXT: Record<SubmissionIssue, string> = {
  [SUBMISSION_ISSUE.EMPTY]: "sin responder",
  [SUBMISSION_ISSUE.TOO_MANY]: "va UNA sola palabra (una contracción como «don't» cuenta como dos)",
};

/**
 * Part 2 en formato examen: el texto entero con ocho huecos y sin
 * opciones. Respondés en cualquier orden y corregís al final, así que no
 * usa el motor de rondas (decisión #17).
 */
export function OpenClozeExam() {
  const idPrefix = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper>(() => buildPaper(pickText(TEXTS)));
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [checked, setChecked] = useState(false);
  const [showIssues, setShowIssues] = useState(false);

  const byIndex = new Map(paper.gaps.map((paperGap) => [paperGap.index, paperGap]));
  const issues = paper.gaps.flatMap((paperGap) => {
    const issue = findIssue(answers[paperGap.gap.id]);
    return issue === null ? [] : [{ paperGap, issue }];
  });
  const issueById = new Map(issues.map(({ paperGap, issue }) => [paperGap.gap.id, issue]));
  const result = checked ? grade(paper, answers) : undefined;
  const answered = paper.gaps.filter((paperGap) => (answers[paperGap.gap.id] ?? "").trim() !== "").length;

  // El aviso agrupa los espacios por problema: un botón por espacio.
  const numbersByIssue = new Map<SubmissionIssue, number[]>();
  for (const { paperGap, issue } of issues) {
    numbersByIssue.set(issue, [...(numbersByIssue.get(issue) ?? []), paperGap.number]);
  }
  const issueGroups = [...numbersByIssue];

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
      <GameCard bleed>
        {result !== undefined ? (
          <ScoreBanner ref={resultRef} correct={result.correct} total={result.total} />
        ) : (
          <Rubric>
            <strong>Escribí UNA palabra en cada espacio.</strong> Hay un ejemplo al principio (0). Enter
            pasa al espacio siguiente; en el último, corrige.
          </Rubric>
        )}

        <ExamText
          title={paper.text.title}
          paragraphs={paper.text.paragraphs}
          renderGap={(index) => {
            if (index === 0) {
              return (
                <span className={gapStyles.gap}>
                  <GapNumber number={0} />
                  <span className={gapStyles.example}>{paper.example.gap.answers[0]}</span>
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
              <span className={gapStyles.gap}>
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
                  // Corregido, el campo se achica a la respuesta (field-sizing no
                  // gana contra un ancho fijo, y Safari no lo soporta).
                  style={checked ? { width: `${value.length + 1}ch` } : undefined}
                  aria-label={`Espacio ${number}`}
                  aria-invalid={invalid || correct === false}
                  enterKeyHint={number < paper.gaps.length ? "next" : "done"}
                  inputMode="text"
                  autoComplete="off"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className={gapFieldClass({
                    filled: value !== "",
                    missing: invalid,
                    checked,
                    correct,
                    width: "short",
                  })}
                />
                {correct === true && <GapTick />}
                {correct === false && <GapFix>{gap.answers[0]}</GapFix>}
              </span>
            );
          }}
        />
      </GameCard>

      {checked && (
        <CorrectionSheet>
          {paper.gaps.map(({ gap, number }) => {
            const written = (answers[gap.id] ?? "").trim();
            const correct = isCorrect(gap, written);
            // Las otras respuestas que también valían: se aprende tanto
            // como de la correcta.
            const alternatives = correct
              ? gap.answers.filter((answer) => answer !== normalize(written))
              : gap.answers.slice(1);
            return (
              <CorrectionRow
                key={gap.id}
                number={number}
                correct={correct}
                title={gap.label}
                verdict={
                  <>
                    {correct ? (
                      <>
                        Escribiste «<Pencil>{written}</Pencil>»
                      </>
                    ) : (
                      <>
                        Escribiste «<Struck>{written}</Struck>» · Era «<Handwritten>{gap.answers[0]}</Handwritten>»
                      </>
                    )}
                    {alternatives.length > 0 && <> · también: {alternatives.join(", ")}</>}
                  </>
                }
              >
                {gap.explanation}
              </CorrectionRow>
            );
          })}
        </CorrectionSheet>
      )}

      <ActionBar>
        {checked ? (
          <BarStack>
            <Button variant={BUTTON_VARIANT.PRIMARY} onClick={() => start(buildPaper(pickText(TEXTS, paper.text.id)))}>
              Otro texto
            </Button>
            <Button variant={BUTTON_VARIANT.GHOST} onClick={() => start(buildPaper(paper.text))}>
              Mismo texto, otros espacios
            </Button>
          </BarStack>
        ) : (
          <>
            {showIssues && issueGroups.length > 0 && (
              <BarWarning>
                <ul>
                  {issueGroups.map(([issue, numbers]) => (
                    <li key={issue}>
                      {numbers.map((number) => (
                        <GapChip key={number} number={number} onClick={() => focusGap(number)} />
                      ))}{" "}
                      {ISSUE_TEXT[issue]}
                    </li>
                  ))}
                </ul>
              </BarWarning>
            )}
            <BarRow>
              <BarCount count={answered} total={paper.gaps.length} noun="respondidos" />
              <Button variant={BUTTON_VARIANT.PRIMARY} onClick={check}>
                Corregir
              </Button>
            </BarRow>
          </>
        )}
      </ActionBar>
    </div>
  );
}

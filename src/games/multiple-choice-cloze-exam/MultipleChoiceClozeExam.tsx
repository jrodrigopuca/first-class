import { clsx } from "clsx";
import { useId, useRef, useState } from "react";
import { Button, BUTTON_VARIANT, ExamText, GameCard, GapNumber, ScoreBanner } from "../../engine/ui";
import { buildPaper, grade, pickText, type Paper } from "./paper";
import { TEXTS } from "./texts";
import styles from "./MultipleChoiceClozeExam.module.css";

/**
 * Part 1 en formato examen: el texto entero, el ejemplo (0) y ocho
 * espacios, cada uno con un desplegable de cuatro opciones.
 *
 * Las opciones van DENTRO del texto (un <select> por espacio) y no en una
 * hoja al final: así elegís sin perder el lugar de lectura. El costo es
 * que las cuatro opciones no están a la vista hasta abrir el desplegable.
 *
 * No usa el motor de rondas ni la repetición espaciada (decisión #17):
 * respondés en el orden que quieras y corregís al final.
 */
export function MultipleChoiceClozeExam() {
  const idPrefix = useId();
  const resultRef = useRef<HTMLDivElement>(null);

  const [paper, setPaper] = useState<Paper>(() => buildPaper(pickText(TEXTS)));
  const [answers, setAnswers] = useState<Readonly<Record<string, string>>>({});
  const [checked, setChecked] = useState(false);
  const [showWarning, setShowWarning] = useState(false);

  const byIndex = new Map(paper.gaps.map((paperGap) => [paperGap.index, paperGap]));
  const missing = paper.gaps.filter((paperGap) => answers[paperGap.gap.id] === undefined);
  const result = checked ? grade(paper, answers) : undefined;

  const selectId = (number: number) => `${idPrefix}-gap-${number}`;
  const focusGap = (number: number) => document.getElementById(selectId(number))?.focus();

  const choose = (gapId: string, option: string) => {
    // Corregido, el examen queda congelado. No se usa `disabled`: sacaría
    // los desplegables del orden de Tab y no dejaría recorrer el texto.
    if (checked || option === "") return;
    setAnswers((prev) => ({ ...prev, [gapId]: option }));
    setShowWarning(false);
  };

  const check = () => {
    const first = missing[0];
    if (first !== undefined) {
      // Validar ANTES de corregir: un espacio vacío no es un error de
      // vocabulario. Y en el examen no se resta: siempre conviene responder.
      setShowWarning(true);
      focusGap(first.number);
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
        Elegí en cada espacio la opción que mejor completa el texto. Hay un ejemplo al principio
        (0). Respondé en el orden que quieras y corregí al final.
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
                  {paper.example.gap.answer}
                </span>
              );
            }

            const paperGap = byIndex.get(index);
            // Un candidato que esta vez no salió se lee como texto común.
            if (paperGap === undefined) return paper.text.gaps[index]?.answer;

            const { gap, number, options } = paperGap;
            const chosen = answers[gap.id];
            const correct = checked ? chosen === gap.answer : undefined;
            const invalid = showWarning && chosen === undefined;

            return (
              <span className={styles.gap}>
                <GapNumber number={number} />
                <select
                  id={selectId(number)}
                  value={chosen ?? ""}
                  onChange={(event) => choose(gap.id, event.target.value)}
                  aria-label={`Espacio ${number}`}
                  aria-invalid={invalid || correct === false}
                  className={clsx(
                    styles.select,
                    chosen === undefined && styles.selectEmpty,
                    invalid && styles.selectInvalid,
                    correct === true && styles.selectCorrect,
                    correct === false && styles.selectWrong,
                  )}
                >
                  {/* hidden: se muestra mientras no hay elección, pero no figura en la lista */}
                  <option value="" disabled hidden>
                    elegí…
                  </option>
                  {options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {correct === false && <span className={styles.fix}>{gap.answer}</span>}
              </span>
            );
          }}
        />
      </GameCard>

      <GameCard>
        {checked ? (
          <ol className={styles.explanations}>
            {paper.gaps.map(({ gap, number }) => {
              const chosen = answers[gap.id] ?? "";
              const correct = chosen === gap.answer;
              return (
                <li key={gap.id} className={clsx(styles.row, correct ? styles.rowCorrect : styles.rowWrong)}>
                  <span className={styles.rowNumber}>{number}</span>
                  <div>
                    <p className={styles.verdict}>
                      {correct ? `✓ «${chosen}»` : `✗ Elegiste «${chosen}» · Era «${gap.answer}»`}
                      <span className={styles.label}>{gap.label}</span>
                    </p>
                    <p className={styles.explanationText}>{gap.explanation}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          showWarning &&
          missing.length > 0 && (
            <p className={styles.warning} role="alert">
              {missing.length === 1 ? "Te falta 1 espacio" : `Te faltan ${missing.length} espacios`} (
              {missing.map((paperGap, i) => (
                <span key={paperGap.gap.id}>
                  {i > 0 && ", "}
                  <button type="button" className={styles.issueLink} onClick={() => focusGap(paperGap.number)}>
                    {paperGap.number}
                  </button>
                </span>
              ))}
              ). En el examen no se resta: respondé siempre.
            </p>
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

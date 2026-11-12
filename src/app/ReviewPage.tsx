import { clsx } from "clsx";
import { useState } from "react";
import { byWeakness, type FamilyStats } from "../engine/review";
import { loadProgress } from "../engine/storage";
import { toHref } from "../lib/router";
import { REVIEWABLE_GAMES } from "../registry";
import styles from "./ReviewPage.module.css";

const ALL = "all";

const WEAK_BELOW = 0.6;
const STRONG_FROM = 0.85;

interface ReviewPageProps {
  /** Filtro por juego, desde la URL. */
  gameId?: string | undefined;
  /** Familia a abrir de entrada, cuando venís desde un error. */
  familyId?: string | undefined;
}

/**
 * Identidad de un grupo en esta página: JUEGO + grupo.
 *
 * El id del grupo solo es único dentro de su juego: la pre-práctica del
 * Part 1 y la del Part 2 tienen las dos un grupo "linker". Con el id solo,
 * abrir los conectores de uno abría también los del otro en la pestaña
 * Todo. No se arregla cambiando los ids de grupo: los links "Ver toda la
 * familia" de cada juego ya los usan.
 */
function groupKey(gameId: string, familyId: string): string {
  return `${gameId}:${familyId}`;
}

interface Row extends FamilyStats {
  gameId: string;
  gameTitle: string;
}

/**
 * Repaso: las explicaciones que ya existen, agrupadas por familia y
 * ordenadas por lo que más fallás.
 *
 * No hay contenido nuevo. Todo sale de buildReview() de cada manifest y
 * del progreso que la repetición espaciada ya venía guardando.
 *
 * Sobre leer el progreso de los cuatro juegos desde acá: el aislamiento
 * que montamos impide que un JUEGO alcance a otro. La cáscara ya conoce
 * el catálogo entero por el registry, así que agregarlo para mostrarlo
 * es legítimo — y es solo lectura.
 */
export function ReviewPage({ gameId, familyId }: ReviewPageProps) {
  // La URL de una familia siempre trae su juego: /review/<gameId>/<familyId>.
  const [openGroup, setOpenGroup] = useState<string | null>(
    gameId !== undefined && familyId !== undefined ? groupKey(gameId, familyId) : null,
  );

  // Solo la pre-práctica tiene repaso: la práctica intensiva no guarda
  // progreso y no habría nada que ordenar (decisión #17).
  const selected =
    gameId !== undefined && REVIEWABLE_GAMES.some((game) => game.id === gameId) ? gameId : ALL;
  const games = selected === ALL ? REVIEWABLE_GAMES : REVIEWABLE_GAMES.filter((game) => game.id === selected);

  const rows: Row[] = games.flatMap((game) => {
    const progress = loadProgress(game.id);
    return byWeakness(game.buildReview(), progress).map((stats) => ({
      ...stats,
      gameId: game.id,
      gameTitle: game.subtitle,
    }));
  });

  // Al mirar los cuatro juegos juntos hay que reordenar: cada uno venía
  // ordenado por su cuenta.
  rows.sort((a, b) => {
    if (a.accuracy === undefined && b.accuracy === undefined) return 0;
    if (a.accuracy === undefined) return 1;
    if (b.accuracy === undefined) return -1;
    return a.accuracy - b.accuracy;
  });

  const practised = rows.filter((row) => row.accuracy !== undefined).length;

  return (
    <>
      <div className={styles.header}>
        <a href={toHref("/")} className={styles.back}>
          ← Todos los juegos
        </a>
        <h1 className={styles.title}>Repaso</h1>
        <p className={styles.lead}>
          {practised === 0
            ? "Todavía no practicaste nada. Jugá una ronda y esto se ordena solo, de lo que más fallás a lo que ya dominás."
            : `Ordenado por lo que más fallás. ${practised} familias con datos.`}
        </p>
      </div>

      <div className={styles.tabs}>
        <a
          href={toHref("/review")}
          className={clsx(styles.tab, selected === ALL && styles.tabActive)}
        >
          Todo
        </a>
        {REVIEWABLE_GAMES.map((game) => (
          <a
            key={game.id}
            href={toHref(`/review/${game.id}`)}
            className={clsx(styles.tab, selected === game.id && styles.tabActive)}
          >
            {game.subtitle}
          </a>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className={styles.empty}>No hay material de repaso para este juego.</p>
      ) : (
        <div className={styles.groups}>
          {rows.map((row) => {
            const key = groupKey(row.gameId, row.family.id);
            return (
              <FamilyGroup
                key={key}
                row={row}
                open={openGroup === key}
                onToggle={() => setOpenGroup(openGroup === key ? null : key)}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

interface FamilyGroupProps {
  row: Row;
  open: boolean;
  onToggle: () => void;
}

function FamilyGroup({ row, open, onToggle }: FamilyGroupProps) {
  const { accuracy, attempted, hits, family } = row;

  return (
    <div className={clsx(styles.group, open && styles.groupOpen)}>
      <button type="button" onClick={onToggle} className={styles.groupHead} aria-expanded={open}>
        <span>
          <span className={styles.groupGame}>
            {row.gameTitle} · {family.entries.length} ítems
          </span>
          <span className={styles.groupTitle}>{family.title}</span>
        </span>
        <span className={clsx(styles.score, toneOf(accuracy))}>
          {accuracy === undefined ? "sin datos" : `${hits}/${attempted}`}
        </span>
      </button>

      {open && (
        <ul className={styles.entries}>
          {family.entries.map((entry) => (
            <li key={entry.questionId}>
              <p className={styles.prompt}>
                {entry.cue !== undefined && <span className={styles.cue}>{entry.cue}</span>}
                <Filled prompt={entry.prompt} answer={entry.answer} />
              </p>
              <p className={styles.explanation}>{entry.explanation}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function toneOf(accuracy: number | undefined): string | undefined {
  if (accuracy === undefined) return styles.untouched;
  if (accuracy < WEAK_BELOW) return styles.weak;
  if (accuracy < STRONG_FROM) return styles.mid;
  return styles.strong;
}

/** La frase con la respuesta ya puesta en el hueco. */
function Filled({ prompt, answer }: { prompt: string; answer: string }) {
  const [before = "", after = ""] = prompt.split("___");
  return (
    <>
      {before}
      <span className={styles.filled}>{answer}</span>
      {after}
    </>
  );
}

import { GAME_SECTION, type GameSection } from "../engine/types";
import { Arrow } from "../engine/ui";
import { GAMES } from "../registry";
import { toHref } from "../lib/router";
import styles from "./HomePage.module.css";

interface SectionInfo {
  id: GameSection;
  title: string;
  tag: string;
  lead: string;
}

/** Los nombres de las secciones viven acá y solo acá. */
const SECTIONS: readonly SectionInfo[] = [
  {
    id: GAME_SECTION.PRE_PRACTICE,
    title: "Pre-práctica",
    tag: "frase por frase",
    lead: "Una frase por vez, con repetición espaciada: lo que fallás vuelve hasta que lo sabés.",
  },
  {
    id: GAME_SECTION.INTENSIVE,
    title: "Práctica intensiva",
    tag: "formato examen",
    lead: "El texto completo, como en el examen. Respondés todos los espacios y corregís al final.",
  },
];

/** " · texto" / " · hoja": lo que el subtítulo agrega después de "Part n". */
function formatOf(subtitle: string): string {
  return subtitle.replace(/^Part \d+/, "");
}

export function HomePage() {
  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>Entrená el Use of English</h1>
        <p className={styles.lead}>
          Primero aprendé cada punto frase por frase. Después ensayalo con el formato del examen.
        </p>
      </section>

      <div className={styles.sections}>
        {SECTIONS.map((section) => {
          const games = GAMES.filter((game) => game.section === section.id);
          if (games.length === 0) return null;

          return (
            <section key={section.id} className={styles.sheet} aria-labelledby={`section-${section.id}`}>
              <div className={styles.sectionHead}>
                <h2 id={`section-${section.id}`} className={styles.sectionTitle}>
                  {section.title} <span className={styles.sectionTag}>{section.tag}</span>
                </h2>
                <p className={styles.sectionLead}>{section.lead}</p>
              </div>

              <ul className={styles.rows}>
                {games.map((game) => {
                  const format = formatOf(game.subtitle);
                  return (
                    <li key={game.id}>
                      <a href={toHref(`/games/${game.id}`)} className={styles.row}>
                        <span className={styles.part} aria-hidden="true">
                          <small>PART</small>
                          <span>{game.part}</span>
                        </span>
                        <span>
                          <span className="visually-hidden">{game.subtitle}: </span>
                          <h3 className={styles.rowTitle}>
                            {game.title}
                            {format !== "" && <span className={styles.rowFormat}> {format}</span>}
                          </h3>
                          <p className={styles.rowText}>{game.description}</p>
                        </span>
                        <Arrow className={styles.rowArrow} />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      <a href={toHref("/review")} className={styles.review}>
        <span>
          <h2 className={styles.rowTitle}>
            Lo que más fallás <span className={styles.rowFormat}>· Repaso</span>
          </h2>
          <p className={styles.rowText}>
            Las explicaciones de la pre-práctica, agrupadas por familia y ordenadas por tus errores
            reales.
          </p>
        </span>
        <Arrow className={styles.rowArrow} />
      </a>
    </>
  );
}

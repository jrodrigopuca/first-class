import { GAME_SECTION, type GameSection } from "../engine/types";
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

export function HomePage() {
  return (
    <>
      <section className={styles.intro}>
        <h1 className={styles.title}>Entrená el Use of English</h1>
        <p className={styles.lead}>
          Primero aprendé cada punto frase por frase. Después ensayalo con el formato del examen.
        </p>
      </section>

      {SECTIONS.map((section) => {
        const games = GAMES.filter((game) => game.section === section.id);
        if (games.length === 0) return null;

        return (
          <section key={section.id} className={styles.section} aria-labelledby={`section-${section.id}`}>
            <div className={styles.sectionHead}>
              <h2 id={`section-${section.id}`} className={styles.sectionTitle}>
                {section.title}
                <span className={styles.sectionTag}>{section.tag}</span>
              </h2>
              <p className={styles.sectionLead}>{section.lead}</p>
            </div>

            <div className={styles.grid}>
              {games.map((game) => (
                <a key={game.id} href={toHref(`/games/${game.id}`)} className={styles.card}>
                  <span className={styles.part}>{game.subtitle}</span>
                  <h3 className={styles.cardTitle}>{game.title}</h3>
                  <p className={styles.cardText}>{game.description}</p>
                </a>
              ))}
            </div>
          </section>
        );
      })}

      <a href={toHref("/review")} className={styles.review}>
        <span className={styles.part}>Repaso</span>
        <h2 className={styles.cardTitle}>Lo que más fallás</h2>
        <p className={styles.cardText}>
          Las explicaciones de la pre-práctica, agrupadas por familia y ordenadas
          por tus errores reales.
        </p>
      </a>
    </>
  );
}

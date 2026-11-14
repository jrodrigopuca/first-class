# Diseño: "La hoja corregida"

El sistema visual de la app. Leelo **antes de tocar estilos o agregar una
pantalla**: casi todo se resuelve con tokens y piezas que ya existen, y
hay reglas de color que no son gusto sino significado.

Por qué esta dirección y no otra: [decisiones #19](decisions.md).

---

## La idea en una frase

La app es una hoja de examen. **Vos escribís en lápiz; al corregir
aparece la birome roja del profesor.**

Sale del mundo del B2 First, no de otras interfaces: el cuadernillo con
el número de cada espacio en una caja, la hoja de respuestas en lápiz, la
corrección en birome roja (✓, tachado y la palabra correcta al lado) y
el puntaje circulado arriba. El fondo celeste es la hoja de carpeta
escolar.

## Cuatro materiales, cada uno con un solo rol

| Material | Token | Rol |
| -------- | ----- | --- |
| **Tinta** | `--color-ink`, `--color-ink-muted` | Lo impreso: el texto del examen, la interfaz, el botón principal |
| **Lápiz** | `--color-graphite`, `--color-graphite-line` | **Solo** las respuestas del usuario |
| **Birome roja** | `--color-mark`, `--color-mark-correct` | **Solo** la corrección: ✓, ✗, tachado, palabra correcta, puntaje |
| **Resaltador** | `--color-highlight`, `--color-highlight-ink` | Dónde estás (foco) y lo que falta (aviso) |

Superficies: `--color-desk` (el celeste de fondo), `--color-paper` (la
hoja) y `--color-paper-sunk` (hover de fila, barra de acciones).

### Las tres reglas que no se negocian

1. **El rojo nunca aparece antes de corregir.** Un espacio sin responder,
   una respuesta de dos palabras en el Part 2 o una raíz copiada en el
   Part 3 se marcan con **resaltador**, no en rojo. Es la misma regla del
   código ("una respuesta inválida no es un error de gramática", ver
   [CLAUDE.md](../CLAUDE.md)) llevada a lo visual.
2. **Cada material hace una sola cosa.** No uses la birome para un botón
   de "Reiniciar" ni el lápiz para un texto de la interfaz. Si un color
   no tiene rol, no va.
3. **La ✓ también es roja.** Así corrige un profesor. Acierto y error se
   distinguen por la **forma** (✓ chica contra tachado con la palabra
   reescrita), no por el color, así que funciona igual con daltonismo.
   Pasar a verde es un solo token (`--color-mark-correct`).

## Tipografía

| Familia | Token | Para qué |
| ------- | ----- | -------- |
| **Lexend** (variable, 400–700) | `--font-ui`, `--font-paper` | Todo lo que no es corrección: texto, títulos, respuestas, números |
| **Kalam** 700 | `--font-hand` | **Solo** la birome: la palabra correcta, el puntaje, el "1 de 2" |

- Las dos se cargan con **un solo `<link>`** en `index.html`: 2 archivos
  woff2, ~53 KB.
- **No hay cursiva.** Lexend no tiene, y `body` lleva
  `font-synthesis: none` para que el navegador no la invente. Un rótulo
  se separa por **peso, tamaño o color**. `rg "italic|<em>|<i>" src/`
  tiene que dar vacío.
- La I lleva serifas y la l no: `l / I / 1` no se confunden, y en los
  Parts 2 y 3 la ortografía cuenta.
- Números, KEY WORD y raíz: Lexend 700 con
  `font-variant-numeric: var(--numeric-tabular)`.
- El texto del examen y los inputs van a `--text-paper` (17 px, 18 px
  desde 640 px). **Nunca menos de 16 px en un input**: iOS hace zoom al
  enfocarlo.
- Texto y respuesta se separan por **peso** (400 contra 600), **color**
  (tinta contra lápiz) y la **línea** del espacio.

## Forma

- Radios de 2 a 4 px: papel, no tarjetas. Nada se levanta con el hover.
- Cajas de 1 px en tinta: el número del espacio, la KEY WORD, el "PART n"
  de la home.
- Entre ítems, **reglas de 1 px**, no cajas con fondo de color.
- Lo único que se inclina (−3° a −4°) es la birome.
- Un solo movimiento orquestado: el **círculo del puntaje se dibuja** en
  `--duration-mark` (420 ms) al corregir. Con
  `prefers-reduced-motion` aparece ya dibujado.

## Las piezas (`src/engine/ui/`)

Son estilo sin idioma: el texto en inglés siempre llega desde el juego,
así que no violan "el motor no sabe inglés".

| Pieza | Qué es |
| ----- | ------ |
| `GameCard` (+ `Rubric`, `SheetTitle`) | La hoja. `bleed` la lleva de borde a borde en el celular |
| `ExamText` + `GapNumber` | El texto con espacios y el número en su caja. Pega la puntuación al espacio (`gluePunctuation.ts`) para que una coma nunca quede sola al principio de un renglón |
| `gapFieldClass` + `gapStyles` | El espacio (select o input) y sus estados. **La pieza central** |
| `GapTick` / `GapFix` | La ✓ y la palabra correcta en birome, después del espacio |
| `ScoreBanner` + `ScoreCircle` | El encabezado de la hoja corregida: mensaje y puntaje circulado |
| `CorrectionSheet` / `CorrectionRow` | La lista de corrección, con la marca en el margen |
| `Pencil` / `Struck` / `Handwritten` | Lápiz, tachado en birome y palabra a mano, para usar en texto corrido |
| `ActionBar` (+ `BarRow`, `BarCount`, `BarStack`, `BarWarning`, `BarNote`, `GapChip`) | La barra fija de abajo |
| `Tick` / `Cross` / `Arrow` | Las marcas en SVG |

### Estados del espacio

| Estado | Cómo se ve |
| ------ | ---------- |
| Vacío | Línea punteada en lápiz; placeholder "elegí…" apagado |
| Con respuesta | Línea llena; texto en lápiz, peso 600 |
| Enfocado | Fondo resaltador |
| Con aviso (faltaba al corregir) | Fondo resaltador + `aria-invalid`. **No es rojo** |
| Correcto | ✓ en birome después del control (`visually-hidden`: "correcto") |
| Incorrecto | Respuesta tachada en birome + la correcta a mano al lado (`visually-hidden`: "era …") |
| Corregido (cualquiera) | `readOnly`, **nunca `disabled`** (ver [gotchas #4](gotchas.md)). Se achica al largo de la respuesta |

**La unidad [número + control] nunca se parte entre renglones.** En el
Part 3 la raíz va **en el mismo renglón, antes del campo**
(`[3] FIT ______`): arriba se montaba sobre el renglón anterior. La
palabra correcta, ya corregido, sí puede bajar de renglón.

## El celular es el caso de diseño

| Ancho | Qué cambia |
| ----- | ---------- |
| < 640 px | Hojas y barra de borde a borde · Part 4: el input ocupa todo el ancho mientras respondés · subtítulo solo "Part n · texto" |
| ≥ 640 px | Hojas con margen y radio · texto del examen a 18 px |
| ≥ 960 px | Solo la home: dos columnas alineadas por Part (`subgrid`) |
| `pointer: fine` + ≥ 640 px | Los espacios bajan de 44 a 36 px de alto |

- **Todo control táctil mide ≥ 44 × 44 px** (`--tap-min`). En los
  espacios el truco es `height: var(--tap-min); margin-block: -5px`: el
  área de toque crece y el renglón no.
- **La barra de abajo está siempre visible.** No se esconde con el
  teclado: se probó con `:focus` y en un celular real dejaba sin forma
  de corregir ([gotchas #9](gotchas.md)).
- Inputs con `enterKeyHint` (`"next"` y `"done"` en el último),
  `inputMode="text"`, `autoCapitalize="none"`, `autoCorrect="off"`,
  `spellCheck={false}`, `autoComplete="off"`.
- Viewport con `interactive-widget=resizes-content` (Android) y
  `scroll-padding-block-end` para que el foco no quede bajo la barra.

## Contraste (WCAG AA, medido)

Todo texto pasa 4.5:1 sobre la hoja y sobre el fondo, en claro y en
oscuro. Los valores medidos están en el comentario de cada token en
`src/styles/tokens.css`. Dos pares que hay que cuidar si se toca un
color:

- **Lápiz contra tinta apagada:** tienen que distinguirse (~1.5:1 en
  claro, ~1.4:1 en oscuro). Si se parecen demasiado, una respuesta se lee
  como deshabilitada. Ya pasó.
- **Sobre el resaltador** el texto va en `--color-ink`, nunca en
  `--color-ink-muted`.

## Cómo se verifica (además de `npm run check`)

Nada de esto lo caza un test ([decisiones #16](decisions.md)):

- **Clases de CSS Modules:** cada `styles.X` de un TSX tiene que existir
  en su `.module.css`. Compila igual si falta. Verificalo con un script.
- **A 390 px:** `document.documentElement.scrollWidth === 390` en cada
  pantalla, ningún número separado de su control y controles ≥ 44 px.
- **Antes de corregir no hay nada rojo en pantalla.**
- **En Chrome headless, activá el foco** con
  `Emulation.setFocusEmulationEnabled` antes de probar cualquier regla
  con `:focus`. Sin eso no aplica, y la prueba miente
  ([gotchas #9](gotchas.md)).
- **En un celular real** antes de dar por buena cualquier cosa del
  teclado. Es el ítem 7 del [BACKLOG](../BACKLOG.md).

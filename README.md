# First Class

Juegos para practicar el **B2 First (FCE)** de Cambridge, parte por parte.

```bash
npm install
npm run dev        # http://localhost:5173
npm run check      # typecheck + lint + tests
```

Por separado: `npm run typecheck`, `npm run lint` (incluye el aislamiento
entre juegos), `npm test` y `npm run test:watch`.

## Arquitectura

```
src/
├── lib/        utilidades puras (shuffle, router). No importan nada.
├── exam/       reglas del B2 First compartidas: normalizar y contar
│               palabras como Cambridge (una contracción vale dos).
├── engine/     el motor: useGameRound, repetición espaciada y UI compartida.
├── games/      un juego = una carpeta. Usa engine y lib, y SOLO a sí mismo.
├── registry/   la única capa que conoce a todos los juegos.
└── app/        la cáscara: layout, home, ruteo. Conoce el registry.
```

Las flechas de dependencia van en UNA sola dirección, de arriba hacia
abajo. No es una convención escrita en un documento que nadie lee:
está enforzada por `eslint-plugin-boundaries` en `eslint.config.js`.
Si un juego importa de otro, `npm run lint` falla.

### Por qué el motor es compartido y el estado no

Los juegos no intercambian información: cada uno se monta en su propia
ruta con `key={game.id}`, así que React desmonta el anterior y su estado
deja de existir. Lo que SÍ comparten es el contrato — qué es una ronda,
cómo se puntúa, cómo se ve un botón. Compartir la estructura no es
compartir el living.

Los estilos siguen la misma lógica: CSS Modules scopea cada clase a su
archivo, así que un juego no puede pisarle un estilo a otro ni queriendo.

## Contenido: familias, no pares

Cada pregunta pertenece a una **familia** (el lema: `create`, `friend`,
`legal`). Una familia agrupa todas sus formas:

```
create → creation (sustantivo) · creative (adjetivo) · creativity (sustantivo)
```

Esto no es organización: es la mecánica pedagógica central. Cuando una
raíz mapea a UNA sola respuesta, el jugador memoriza el par y deja de
leer la frase — pasa de recuperar la regla a reconocer un ítem, que es
justamente lo que el examen no premia. Con varias formas por familia,
ver `CREATE` no le dice nada: tiene que detectar qué categoría
gramatical pide el hueco.

Hoy el **92% de los ítems tiene una raíz ambigua**. Al agregar contenido,
mantené esa proporción: sumá formas a familias existentes antes que
familias nuevas con un solo ítem.

`questions.ts` valida el dataset al cargar y revienta con un mensaje
preciso si dos ítems de la misma familia aceptan la misma respuesta.

El test de cada dataset lo importa, así que esa validación corre en CI y
no solo al recargar el navegador.

## Tests

`npm test` — Vitest, 78 tests, ~1 segundo.

Están puestos donde pueden cazar el bug al menor costo:

| Qué | Por qué ahí |
| --- | --- |
| `engine/leitner.test.ts` | Lógica pura, recibe el tiempo por parámetro: simula meses de estudio sin un solo mock de reloj |
| `engine/storage.test.ts` | El contrato es "nunca confíes en lo guardado": JSON corrupto, versión vieja, storage que lanza |
| `engine/useGameRound.test.tsx` | Regresión del bug original: la ronda no se rearmaba al cambiar de filtro |
| `key-word-transformation/grading.test.ts` | Contar palabras como Cambridge, contracciones incluidas |
| `*/questions.test.ts` | Importar el dataset corre su validación entera + invariantes pedagógicos |

Los invariantes pedagógicos son los que ningún compilador puede ver: que
al menos el 85% de los ítems del Part 3 tenga una raíz ambigua, y que el
Part 4 reutilice palabras clave entre estructuras. Si alguien suma
contenido que degrada la mecánica de aprendizaje, el test falla y dice
qué hacer.

No hay tests de componentes. La UI se verificó a mano en el navegador;
el día que un flujo se vuelva crítico, va a Playwright, no a más unit
tests contra el DOM.

## Repaso

`#/review` agrupa las explicaciones que ya existen y las ordena por lo
que más fallás, cruzando `buildReview()` de cada manifest con el
progreso que guarda la repetición espaciada.

**No hay contenido nuevo:** son las mismas 228 explicaciones que ya se
mostraban al fallar. Antes se veían una vez y se perdían; ahora se leen
juntas y se pueden volver a buscar.

Cada juego elige **su** unidad de agrupación, porque solo él sabe cuál
forma una lección:

| Juego  | Agrupa por | Motivo |
| ------ | ---------- | ------ |
| Part 3 | familia    | solo 1 de 38 familias tiene un ítem suelto |
| Part 1 | categoría  | 14 de 23 familias son de un solo ítem |
| Part 2 | categoría  | **las 45** familias son de un solo ítem |
| Part 4 | categoría  | 28 de 34 familias son de un solo ítem |

`groupIdOf()` se exporta desde `review.ts` y la usan tanto el agrupador
como el link "Ver toda la familia" que aparece al fallar, así que no
pueden desincronizarse.

Lo nunca practicado va al FINAL, no al principio: ausencia de datos no
es debilidad demostrada.

> **Nota de diseño:** la página de repaso lee el progreso de los cuatro
> juegos. El aislamiento que enforza el linter impide que un JUEGO
> alcance a otro; la cáscara ya conoce el catálogo entero por el
> registry, así que agregarlo para mostrarlo es legítimo — y es solo
> lectura.

## Agregar un juego nuevo

1. `src/games/<mi-juego>/` con:

   - `types.ts` — tu pregunta extiende `Question` del engine
   - `questions.json` + `questions.ts` — datos y su validación en la frontera
   - `MiJuego.tsx` + `MiJuego.module.css`
   - `review.ts` — `groupIdOf()` y `buildReview()`
   - `manifest.ts` — id, parte del examen, título, descripción, componente
     y `buildReview` (**obligatorio**: un juego sin material de repaso
     desaparecería del estudio en silencio)

2. Una línea en `src/registry/index.ts`.

Listo. La home y las rutas se actualizan solas. El puntaje, la racha, la
barra de progreso y la pantalla de resultados ya te los da `useGameRound`.

```tsx
const round = useGameRound<MiPregunta, MiRespuesta>({
  questions: pool,
  roundLength: 15,
  roundKey: filtroActivo, // cambiarlo arma una ronda nueva
  isCorrect: (pregunta, respuesta) => /* solo tu juego sabe qué es "bien" */,
});
```

## Estado

| Parte  | Juego                     | Estado    |
| ------ | ------------------------- | --------- |
| Part 1 | Multiple-choice Cloze     | ✅ listo  |
| Part 2 | Open Cloze                | ✅ listo  |
| Part 3 | Word Formation            | ✅ listo  |
| Part 4 | Key Word Transformation   | ✅ listo  |

**Contenido:** Part 1 tiene 41 ítems en 23 familias de vocabulario.
Part 2 tiene 45 ítems en 8 tipos de palabra gramatical.
Part 3 tiene 102 ítems en 38 familias (2,7 formas por familia).
Part 4 tiene 40 ítems en 34 estructuras gramaticales.

El Part 1 se modela como frases sueltas y no como un texto de 8 huecos,
porque con repetición espaciada **un hueco es una unidad de
programación**: si un ítem fuera un texto entero, fallar un hueco te
haría repasar los ocho. Se pierde el entrenamiento de "leer el texto
completo", que se cubre con exámenes de práctica reales.

Sus opciones se barajan en cada presentación: si la correcta cayera
siempre en el mismo lugar, memorizarías la posición en vez del
vocabulario. Y hay un test que exige que las palabras se reutilicen como
respuesta en un ítem y como distractor en otro, para que ninguna sea
"siempre la correcta".

El Part 4 cuenta las palabras **como Cambridge**: las contracciones valen
dos (`aren't` = are + not). Esa lógica vive en `grading.ts` y la usan tanto
el juego como el validador del dataset — una sola fuente de verdad, para
que no exista contenido que pase el control y el juego rechace.

## Repetición espaciada

Cada ítem vive en una **caja Leitner** del 1 al 5. Acertar lo sube una
caja y lo aleja en el tiempo; fallar lo devuelve a la caja 1.

| Caja | Vuelve en |
| ---- | --------- |
| 1    | enseguida |
| 2    | 1 día     |
| 3    | 3 días    |
| 4    | 7 días    |
| 5    | 16 días   |

La ronda **no** es la cola de vencidos: es de largo fijo y se llena por
prioridad — primero lo vencido, después lo que nunca viste, y solo si
sobra lugar, lo que todavía no toca (cajas más bajas primero).

Es una decisión de producto, no técnica: con una cola pura habría días
en que abrís la app y no hay nada que hacer, y eso mata el hábito. En
una app de estudio, que aparezcas todos los días vale más que la
eficiencia teórica del algoritmo.

### Aislamiento del progreso

Tres capas, ninguna basada en buena voluntad:

1. **El id del juego baja por contexto** (`engine/gameIdentity.ts`),
   inyectado por `GamePage` desde el registry. Un juego no elige su
   propio id, así que no puede escribir en el namespace de otro aunque
   copies la carpeta y te olvides de cambiar un string.
2. **Un solo módulo toca `localStorage`** (`engine/storage.ts`). Una
   regla de ESLint lo enforza: cualquier otro archivo que lo use, falla.
3. **Los ids de las preguntas son estables y semánticos**
   (`clear-clarity`, no `42`). Son la llave de la memoria del usuario:
   si fueran posicionales, insertar una pregunta le reasignaría a cada
   ítem el historial de otro.

### Sobre las reglas de capa en ESLint

`eslint-plugin-boundaries` enforza el aislamiento entre juegos, y eso
está verificado rompiéndolo. Pero **solo resuelve dependencias bajo
`src/games/*`**: un import a `src/engine`, `src/lib` o `src/exam` le
queda como "unknown element" y su regla no dispara. Medido con
`boundaries/no-unknown`, no supuesto.

Por eso las reglas de CAPA (el motor no sabe inglés, lib no importa
nada, la cáscara no conoce juegos concretos) se enforzan con
`no-restricted-imports`, del core de ESLint: mira el string del import
y nada más, así que no puede fallar en silencio. Las ocho están
verificadas una por una.

> **Límite honesto:** `localStorage` vive en ESE navegador. Para
> estudiar en el celular y en la notebook con el mismo progreso hace
> falta un backend, que hoy no existe.

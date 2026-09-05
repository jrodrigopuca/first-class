# Arquitectura

## Capas

```
app/       la cáscara: layout, home, ruteo, página de repaso
  ↓
registry/  la única capa que conoce a TODOS los juegos
  ↓
games/     un juego = una carpeta. Aislados entre sí.
  ↓
engine/    ronda, puntaje, repetición espaciada, UI compartida
exam/      reglas del B2 First: normalizar, contar palabras
  ↓
lib/       utilidades puras: shuffle, router
```

Las dependencias van en **una sola dirección**. Reglas concretas:

| Capa       | Puede importar de                       |
| ---------- | --------------------------------------- |
| `lib`      | nada                                     |
| `exam`     | `lib`                                    |
| `engine`   | `lib` — **no** `exam`: el motor no sabe inglés |
| `games/x`  | `engine`, `exam`, `lib`, y **solo a sí mismo** |
| `registry` | `engine`, `games/*`                      |
| `app`      | `engine`, `lib`, `registry`              |

`engine` no depende de `exam` a propósito: su ignorancia del idioma es lo
que le permite servir a cualquier juego.

## Qué enforza cada regla (y qué NO)

Dos mecanismos distintos, por un motivo medido:

| Regla | Mecanismo | Estado |
| ----- | --------- | ------ |
| Un juego no importa de otro | `eslint-plugin-boundaries` | ✅ verificado |
| Las capas (tabla de arriba) | `no-restricted-imports` | ✅ 8 reglas verificadas |
| Solo `engine/storage.ts` toca `localStorage` | `no-restricted-globals` + `no-restricted-properties` | ✅ verificado |

**`eslint-plugin-boundaries` NO puede enforzar las capas** en este
proyecto: solo resuelve dependencias bajo `src/games/*`. Ver
[gotchas #1](gotchas.md#1-eslint-plugin-boundaries-solo-ve-srcgames).

Todas las reglas fueron verificadas **rompiéndolas a propósito** y
viéndolas fallar. Una regla que nunca viste disparar no es una regla: es
un comentario con sintaxis de config.

## Aislamiento entre juegos: cuatro capas

1. **Lint** — `games/a` no puede importar de `games/b`.
2. **Montaje** — `<Component key={game.id} />` en `GamePage`: React
   desmonta el juego anterior, su estado en memoria deja de existir.
3. **Identidad** — el `gameId` baja por contexto desde el registry. Un
   juego no elige su id, así que no puede escribir en el namespace de
   otro aunque copies la carpeta y te olvides de cambiar el string.
4. **Estilos** — CSS Modules scopea cada clase a su archivo.

**La excepción deliberada:** `app/ReviewPage.tsx` lee el progreso de los
cuatro juegos. La garantía es que un JUEGO no alcanza a otro; la cáscara
ya conoce el catálogo por el registry, así que agregarlo para mostrarlo
es legítimo — y es solo lectura.

## Flujo de una partida

```
GamePage                     saca el manifest del registry
  └─ GameIdentityProvider    inyecta el gameId
      └─ <Juego>
          ├─ useSpacedRepetition()   lee progreso de localStorage
          │    └─ scheduler { select, record }
          └─ useGameRound({ questions, roundKey, isCorrect, scheduler })
               ├─ select()  → arma la ronda (vencido → nuevo → resto)
               ├─ submit()  → isCorrect() del juego, luego record()
               └─ next() / restart()
```

El motor **no sabe** qué es correcto en cada dominio (`isCorrect` lo pone
el juego) ni qué es una caja Leitner (`scheduler` es opcional).

## Anatomía de un juego

```
src/games/<juego>/
├── types.ts          la pregunta extiende Question del engine
├── questions.json    el contenido
├── questions.ts      valida el dataset EN LA FRONTERA y lo exporta
├── grading.ts        (opcional) reglas de corrección propias
├── review.ts         groupIdOf() + buildReview()
├── <Juego>.tsx       el componente
├── <Juego>.module.css
├── manifest.ts       la tarjeta de identidad
└── *.test.ts
```

## Agregar un juego

1. Crear la carpeta con esos archivos.
2. Una línea en `src/registry/index.ts`.

La home, las rutas y el repaso se actualizan solos. El compilador te
obliga a proveer `buildReview`.

```tsx
const srs = useSpacedRepetition<MiPregunta>();

const round = useGameRound<MiPregunta, MiRespuesta>({
  questions: pool,
  roundLength: 12,
  roundKey: filtroActivo,   // al cambiar, arma una ronda nueva
  isCorrect,                // solo tu juego sabe qué es "bien"
  scheduler: srs.scheduler,
});
```

**Validá el intento ANTES de `submit()`.** Si la respuesta es inválida
según las reglas del examen (más de 5 palabras en el Part 4, más de una
en el Part 2), no es un error de gramática: no debería costar la racha ni
llegar al motor de puntaje. Ese patrón es lo que permitió que el engine
no cambiara al sumar juegos con reglas muy distintas.

## Tests

126 tests, ~1 segundo. Puestos donde cazan el bug al menor costo:

| Archivo | Qué protege |
| ------- | ----------- |
| `engine/leitner.test.ts` | El algoritmo. Recibe el tiempo por parámetro: simula meses sin mocks de reloj |
| `engine/review.test.ts` | El orden por debilidad; lo no practicado va al final |
| `engine/storage.test.ts` | "Nunca confíes en lo guardado": JSON roto, versión vieja, storage que lanza |
| `engine/useGameRound.test.tsx` | Regresión: la ronda no se rearmaba al cambiar de filtro |
| `exam/text.test.ts` | Contar palabras como Cambridge. Lo comparten tres juegos |
| `games/*/questions.test.ts` | Importar el dataset corre su validación entera **en CI** |

Los **invariantes pedagógicos** son los que ningún compilador ve:

- Part 3: ≥85% de los ítems con raíz ambigua
- Part 1: ≥40% de las respuestas aparecen también como distractor
- Part 4: palabras clave reutilizadas entre estructuras
- Repaso: los `questionId` coinciden con los ids reales

Si uno de estos falla, **no bajes el umbral**: el contenido nuevo
degradó la mecánica de aprendizaje. El mensaje del test dice qué hacer.

## Deploy

`.github/workflows/deploy.yml` corre `typecheck → lint → test → build →
deploy` en cada push a `main`. Publica en
<https://jrodrigopuca.github.io/first-class/>.

`base: "/first-class/"` en `vite.config.ts` porque la app no vive en la
raíz del dominio.

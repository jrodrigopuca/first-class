# First Class

Juegos para practicar el **Use of English** del B2 First (FCE) de
Cambridge, con repetición espaciada.

**▶ <https://jrodrigopuca.github.io/first-class/>**

```bash
npm install
npm run dev      # http://localhost:5173
npm run check    # typecheck + lint + tests
```

Por separado: `npm run typecheck`, `npm run lint`, `npm test`,
`npm run test:watch`, `npm run build`.

## Estado

| Parte | Juego | Ítems |
| ----- | ----- | ----- |
| Part 1 | Multiple-choice Cloze | 41 |
| Part 2 | Open Cloze | 45 |
| Part 3 | Word Formation | 102 |
| Part 4 | Key Word Transformation | 40 |
| — | **Repaso** (`#/review`) | agrupa las 228 explicaciones |

228 ítems · 126 tests · las cuatro partes del Use of English.

## Cómo funciona, en tres frases

Cada ítem vive en una **caja Leitner**: acertarlo lo aleja en el tiempo,
fallarlo lo trae de vuelta. La ronda es de largo fijo y se llena por
prioridad —primero lo que estás olvidando— para que nunca abras la app y
no tengas nada que hacer. Las explicaciones que ves al fallar se agrupan
en `#/review`, ordenadas por lo que más fallás.

## Mapa

```
src/
├── lib/        utilidades puras: shuffle, router
├── exam/       reglas del B2 First: normalizar, contar palabras
├── engine/     ronda, puntaje, repetición espaciada, UI compartida
├── games/      un juego = una carpeta, aisladas entre sí
├── registry/   la única capa que conoce a todos los juegos
└── app/        layout, home, ruteo, repaso
```

## Documentación

| Documento | Cuándo leerlo |
| --------- | ------------- |
| [architecture.md](docs/architecture.md) | Antes de tocar estructura o agregar un juego |
| [decisions.md](docs/decisions.md) | Antes de cambiar algo que ya está decidido. Cada decisión dice **cuándo reconsiderarla** |
| [gotchas.md](docs/gotchas.md) | Cuando algo se comporta raro. Todo medido, nada supuesto |
| [content.md](docs/content.md) | Para agregar preguntas — la tarea más frecuente |

## Límites conocidos

- **El progreso no se sincroniza entre dispositivos.** `localStorage`
  vive en cada navegador. Necesitaría backend.
- **228 ítems es el techo real.** El SRS los estira, pero el pool es el
  cuello de botella. Ver [content.md](docs/content.md).
- **No hay tests de componentes.** La UI se verifica a mano; el día que
  un flujo se vuelva crítico, va a Playwright.

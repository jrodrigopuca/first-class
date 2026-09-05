# first-class

App de práctica para el B2 First con repetición espaciada. Vite + React
19 + TypeScript estricto, CSS Modules, sin framework de router.

## Leé esto antes de proponer cambios

| Situación | Documento |
| --------- | --------- |
| Vas a cambiar algo ya decidido | [docs/decisions.md](docs/decisions.md) — 16 decisiones con su razonamiento y su gatillo de revisión |
| Algo se comporta raro | [docs/gotchas.md](docs/gotchas.md) — 8 trampas medidas |
| Vas a agregar un juego o tocar capas | [docs/architecture.md](docs/architecture.md) |
| Vas a agregar preguntas | [docs/content.md](docs/content.md) |

**No re-litigues una decisión sin leer su entrada primero.** Cada una
dice explícitamente cuándo conviene revertirla.

## No negociables

- **Los ids de pregunta son para siempre.** Son la llave del progreso del
  usuario. Cambiar uno le borra su historial de ese ítem.
- **Nunca `localStorage.clear()`.** Todas las GitHub Pages de la cuenta
  comparten origen; borrarías datos de otros proyectos. Filtrá por el
  prefijo `first-class:`.
- **Nunca bajes el umbral de un invariante pedagógico para que pase el
  test.** Si falla, el contenido nuevo degradó la mecánica de
  aprendizaje. El mensaje del test dice qué hacer.
- **El motor no sabe inglés.** `engine` no importa de `exam`. Hay una
  regla de lint que lo impide.
- **Validá el intento antes de `submit()`.** Una respuesta inválida según
  las reglas del examen no es un error de gramática: no cuesta la racha
  ni llega al motor de puntaje.

## Disciplina de verificación

Este proyecto acumuló varios bugs que ni el compilador ni el linter ven.
Por eso:

- **Una regla de lint no cuenta hasta verla fallar.** Escribí la
  violación, corré `eslint`, borrá la violación. Sin eso no sabés si la
  regla se ejecuta — ya pasó que una no se ejecutaba nunca.
- **Un test no cuenta hasta verlo fallar.** Rompé el código a propósito y
  confirmá que lo caza.
- **La UI se verifica en el navegador.** Los bugs de teclado, foco y
  clases CSS faltantes no los caza ningún test de este repo.
- **Los nombres de clase de CSS Modules NO se tipan.** `styles.loQueSea`
  compila siempre.

## Comandos

```bash
npm run check    # typecheck + lint + test
npm run dev
npm test
```

No hace falta `npm run build` salvo para verificar el deploy: el CI
buildea en cada push a `main`.

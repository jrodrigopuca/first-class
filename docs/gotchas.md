# Trampas

Cosas que **costaron tiempo real** de descubrir y volverían a costarlo.
Cada una está medida, no supuesta.

Si algo se comporta raro, buscá acá antes de investigar de cero.

---

## 1. `eslint-plugin-boundaries` solo ve `src/games/*`

**Síntoma:** escribís una política de capas, se ve perfecta en el config,
y no dispara nunca.

**Medido así:**

```js
// activar temporalmente en eslint.config.js
"boundaries/no-unknown": "error",
```

```
../exam/text                       → unknown element
../engine/types                    → unknown element
../lib/shuffle                     → unknown element
../registry                        → unknown element
../games/word-formation/questions  → 'app' no puede importar de 'game' ✓
```

El plugin **solo resuelve como dependencia lo que cae bajo `src/games/*`**.
Todo lo demás le queda sin clasificar y la política se saltea en silencio.
Probé seis formas de patrón (`src/exam`, `src/exam/*`, `src/exam/**`,
`src/exam/**/*`, con y sin `partialMatch`, con `capture`): ninguna cambia
el resultado.

**Por eso:** boundaries queda SOLO para el aislamiento entre juegos, que
es lo que sí funciona. Las reglas de capa usan `no-restricted-imports`,
del core de ESLint, que mira el string del import y no puede fallar en
silencio.

**Nunca agregues una regla sin verla fallar.** Una regla que no dispara
es peor que no tener regla: da confianza falsa.

---

## 2. Node 25 rompe el `localStorage` de jsdom

**Síntoma:** `window.localStorage.setItem is not a function` en tests con
`@vitest-environment jsdom`.

```
node: v25.8.0
window.localStorage: [object Object]
setItem: undefined            ← no es un Storage real
```

Node trae su propio `localStorage` global y choca con el de jsdom,
dejando un objeto sin métodos.

**Solución:** `src/setupTests.ts` instala un `Storage` en memoria fiel a
la spec cuando el entorno no ofrece uno usable.

**Corolario:** los spies van sobre la instancia
(`vi.spyOn(window.localStorage, "getItem")`), **no** sobre
`Storage.prototype`, para que funcionen con cualquier implementación.

---

## 3. Los nombres de clase de CSS Modules NO se tipan

**Síntoma:** `styles.claseQueNoExiste` compila sin chistar y el estilo
simplemente no se aplica.

Vite tipa los módulos CSS como `{ readonly [key: string]: string }`, así
que **cualquier** nombre pasa el typecheck. Ni `tsc` ni `eslint` lo ven.

**Cómo cazarlo:**

```bash
diff <(rg -o "styles\.\w+" src/games/x/X.tsx | sort -u | sed 's/styles\.//') \
     <(rg -o "^\.\w+" src/games/x/X.module.css | sed 's/^\.//' | sort -u)
```

Pasó de verdad: `styles.blankFilled` usado y nunca definido.

---

## 4. Un `<input disabled>` mata el flujo de teclado

**Síntoma:** después de responder, Enter deja de avanzar a la siguiente
pregunta y hay que usar el mouse.

Un input deshabilitado **pierde el foco y no recibe eventos de teclado**,
así que el `onKeyDown` nunca corre.

**Solución:** `readOnly` en vez de `disabled`. Bloquea la edición y
mantiene foco y teclado vivos. El CSS usa `:read-only` en vez de
`:disabled`.

Este bug vivió dos sesiones en dos juegos. **Ningún test lo hubiera
cazado**: solo apareció al intentar jugar sin mouse.

---

## 5. `localStorage` es de TODO `github.io`, no de tu proyecto

Todas las GitHub Pages de una cuenta comparten un origen
(`https://usuario.github.io`), o sea **un solo `localStorage`**.

Encontrado en producción:

```
first-class:multiple-choice-cloze:progress
wc-locale                                  ← de otro proyecto
```

**Por eso todas las claves llevan prefijo `first-class:`.**

**Nunca llames a `localStorage.clear()`**, ni en consola ni en código:
borrarías datos de otros proyectos. Filtrá por prefijo:

```js
Object.keys(localStorage)
  .filter((k) => k.startsWith("first-class:"))
  .forEach((k) => localStorage.removeItem(k));
```

---

## 6. El HMR de Vite NO re-ejecuta la validación de datasets

**Síntoma:** rompés un `questions.json` mientras desarrollás y no pasa
nada. Recargás entero y recién ahí revienta.

La validación corre a nivel de módulo (`assertDatasetIsSane` en
`questions.ts`), y el hot reload no siempre re-evalúa ese módulo.

**Mitigación:** cada dataset tiene un test que lo importa, así que
`npm test` y el CI sí la ejecutan siempre.

---

## 7. `@vitejs/plugin-react` v6 dejó Babel

La opción `babel: { plugins: [...] }` ya no existe. El React Compiler se
activa con `compiler: true` y requiere `oxc-transform-react` instalado.

```ts
react({ compiler: true })   // no: react({ babel: { plugins: [...] } })
```

---

## 8. `exactOptionalPropertyTypes` exige el `| undefined` explícito

Con esa opción activa en `tsconfig.app.json`, una prop opcional no acepta
que le pases `undefined` a mano:

```ts
interface Props {
  className?: string;              // ❌ falla si le pasás undefined
  className?: string | undefined;  // ✅
}
```

Es más verboso, y a cambio distingue "no pasé la prop" de "la pasé en
undefined". Aparece seguido con CSS Modules, porque `styles.x` es
`string | undefined`.

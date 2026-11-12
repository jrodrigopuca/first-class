# Decisiones

Las decisiones caras de revertir, con el razonamiento que las produjo.

Están acá para que no se re-litiguen cada vez que alguien vuelve al
proyecto, y para que **se puedan revertir cuando corresponda**: cada una
lleva su gatillo de revisión. Sin eso, un documento de decisiones es un
museo.

---

## 1. Motor compartido, estado aislado

**Qué:** `engine/` provee ronda, puntaje, racha y repetición espaciada.
Cada juego recibe su propia instancia; ninguno ve el estado de otro.

**Por qué:** aislamiento de ESTADO no es lo mismo que duplicación de
INFRAESTRUCTURA. Dos juegos comparten la definición de "qué es una
ronda" igual que dos departamentos comparten la estructura del edificio.
Ninguno comparte el living.

**Costo:** el motor tiene que ser genérico, con dos parámetros de tipo.

**Cuándo reconsiderarla:** si un juego nuevo necesita torcer el motor
para entrar. Ya sobrevivió a tres juegos con interacciones distintas
(escribir, elegir opción, una palabra), sin cambios.

---

## 2. Router propio por hash, sin librería

**Qué:** ~25 líneas en `lib/router.ts` con `useSyncExternalStore` sobre
`hashchange`.

**Por qué:** un router hace tres cosas —leer la URL, avisar cuando
cambia, dejarte navegar— y son 25 líneas. React Router resuelve rutas
anidadas, loaders y data fetching, nada de lo cual se usa acá.

Y el hash **se pagó en el deploy**: `#/games/x` no le pide nada al
servidor, así que GitHub Pages sirve un `index.html` y listo. Con
History API un F5 en una ruta profunda daría 404 sin configurar
rewrites.

**Costo:** URLs con `#`.

**Cuándo reconsiderarla:** si aparecen rutas anidadas de verdad, o si se
migra a un hosting con rewrites y el `#` molesta para compartir links.

---

## 3. IDs de pregunta semánticos y estables

**Qué:** `clear-clarity`, no `42`.

**Por qué:** el progreso del SRS se guarda POR ÍTEM. Con ids
correlativos, insertar una pregunta en el medio corre todas las
siguientes y **cada una hereda el historial de otra**. El jugador ve
"esto lo dominás" sobre algo que nunca respondió.

**Los ids son la llave de la memoria del usuario. Son para siempre.**

**Costo:** hay que inventar un slug estable al escribir contenido.

**Cuándo reconsiderarla:** nunca, mientras haya persistencia. Cambiar un
id es borrarle el progreso de ese ítem al usuario.

---

## 4. Familias: romper el mapeo raíz → respuesta

**Qué:** una raíz mapea a VARIAS formas (`CREATE` → creation, creative,
creativity), y el 92% de los ítems del Part 3 tiene raíz ambigua.

**Por qué:** con mapeo 1:1 el jugador memoriza el par y deja de leer la
frase: pasa de RECUPERAR la regla a RECONOCER un ítem. El examen le va a
mostrar una raíz que nunca vio, y ahí el diccionario mental no sirve.

Más contenido **no** arregla esto: 500 pares se memorizan igual, solo
que más tarde.

**Costo:** escribir varias frases por familia en vez de una.

**Cuándo reconsiderarla:** no es una decisión técnica, es la mecánica
pedagógica central. Hay un test que falla si baja del 85%.

---

## 5. Leitner, no SM-2 ni FSRS

**Qué:** 5 cajas, intervalos 0/1/3/7/16 días.

**Por qué:** SM-2 saca su potencia de una calificación 0–5 ("¿qué tan
bien lo recordaste?"). Acá la corrección es booleana. Con entrada binaria
SM-2 degenera en algo parecido a Leitner pero con 50 líneas en vez de 20.

**Costo:** menos eficiente en colecciones de miles de ítems. Con 228, la
diferencia es irrelevante.

**Cuándo reconsiderarla:** si se agrega una señal de confianza (auto-
evaluación, tiempo de respuesta) o si el pool supera el millar. El
esquema de storage tiene versión, así que se puede migrar.

---

## 6. Ronda de largo fijo, no cola de vencidos

**Qué:** la ronda siempre trae N ítems: primero lo vencido, después lo
nunca visto, y si sobra lugar, lo que todavía no toca.

**Por qué:** es una decisión de PRODUCTO. Con una cola pura habría días
en que abrís la app y no hay nada que hacer, y eso mata el hábito. En una
app de estudio, que aparezcas todos los días vale más que la eficiencia
teórica del algoritmo.

**Costo:** a veces repasás algo un poco antes de tiempo.

**Cuándo reconsiderarla:** si el pool crece tanto que siempre hay
vencidos de sobra, el relleno deja de activarse solo y no molesta.

---

## 7. `localStorage`, no IndexedDB

**Por qué:** son ~10 KB de números. localStorage es síncrono, así que el
progreso está disponible en el primer render y ningún componente necesita
estado de carga.

**Costo:** vive en ESE navegador. **Sin sincronización entre
dispositivos.**

**Cuándo reconsiderarla:** cuando estudiar desde dos dispositivos con el
mismo progreso sea un requisito real y comprobado, no hipotético. Ahí no
alcanza con IndexedDB: hace falta backend, cuentas y sincronización.

---

## 8. La identidad del juego baja por contexto

**Qué:** `GamePage` inyecta el `gameId` desde el registry;
`useSpacedRepetition()` lo lee de ahí. Un juego **nunca declara su propio
id**.

**Por qué:** la alternativa obvia era
`useSpacedRepetition({ gameId: "word-formation" })`. Copiás la carpeta
para hacer el juego siguiente, te olvidás de cambiar el string, y los dos
comparten progreso. **No crashea, no lintea mal, no se ve**: corrompe
datos de estudio en silencio.

**Costo:** un contexto más.

**Cuándo reconsiderarla:** nunca mientras haya persistencia por juego.

---

## 9. El scheduler es un punto de extensión OPCIONAL

**Qué:** `useGameRound` acepta `scheduler?`. Sin él baraja al azar y no
recuerda nada.

**Por qué:** el motor no sabe qué es una caja Leitner. Pide una ronda y
avisa qué pasó. Eso permitió sumar repetición espaciada **cambiando una
línea** del motor, y permite que un juego futuro la ignore.

**Cuándo reconsiderarla:** si TODOS los juegos siempre usan SRS y el
opcional solo agrega ruido.

---

## 10. Frases sueltas, no textos con 8 huecos

**Qué:** Parts 1 y 2 se modelan como frases independientes, aunque el
examen real use un texto continuo.

**Por qué:** con SRS, **un hueco es una unidad de programación**. Si un
ítem fuera un texto entero, fallar un hueco te haría repasar los ocho y
la granularidad se rompe.

**Costo:** se pierde el entrenamiento de "leer el texto completo". Se
cubre con exámenes de práctica reales.

**Cuándo reconsiderarla:** si aparece un modo "simulacro" que no use SRS.
Ahí el texto continuo sí tiene sentido, como modo aparte.

**Estado:** el gatillo se activó y se resolvió SIN revertirla. Ver la
[#17](#17-dos-secciones-pre-práctica-y-práctica-intensiva): las frases
sueltas siguen siendo la pre-práctica, y el texto continuo es una sección
aparte.

---

## 11. Las opciones del Part 1 se barajan en cada presentación

**Por qué:** si la correcta cayera siempre en el mismo lugar,
memorizarías la POSICIÓN en vez del vocabulario. Es el mismo problema del
mapeo 1:1, con otra cara.

Por eso la respuesta se guarda como VALOR, no como índice.

---

## 12. La capa `exam` se extrajo al TERCER consumidor

**Qué:** `exam/text.ts` (normalizar, contar palabras como Cambridge) vive
aparte del engine.

**Por qué:** con dos consumidores —uno trivial— extraer habría sido
adivinar la forma de la abstracción. El Part 2 fue el tercero y la
duplicación ya era un hecho medido (`normalize` existía en dos juegos).

Va aparte del engine a propósito: **el motor no sabe inglés**, y esa
ignorancia es lo que le permite servir a cualquier juego. Hay una regla
de lint que lo impide.

**Cuándo reconsiderarla:** si `exam` empieza a acumular cosas que en
realidad son de un solo juego, se parte.

---

## 13. Reglas de capa con `no-restricted-imports`, no con boundaries

**Por qué:** `eslint-plugin-boundaries` no resuelve dependencias fuera de
`src/games/*` — ver [gotchas #1](gotchas.md#1-eslint-plugin-boundaries-solo-ve-srcgames). Sus políticas de capa
estaban escritas y **nunca se ejecutaron**.

`no-restricted-imports` mira el string del import y nada más, así que no
puede fallar en silencio. Las ocho reglas están verificadas rompiéndolas
una por una.

**Costo:** los patrones enumeran profundidades relativas (`../` y
`../../`) porque `**` no matchea `..` sin `dot:true`. Si aparece una
carpeta más profunda, hay que sumar un patrón.

**Cuándo reconsiderarla:** si boundaries arregla la resolución, o si
aparece un plugin que la haga bien.

---

## 14. Cada juego decide su agrupación de repaso

**Qué:** Part 3 agrupa por familia; los otros tres por categoría.

**Por qué:** medido — Part 2 tiene **las 45 familias con un solo ítem**.
Agrupar por familia daría 45 "lecciones" de una línea. Solo el juego sabe
cuál es su unidad con sentido, y por eso `buildReview()` vive en el juego
y no en el motor.

`groupIdOf()` se exporta desde `review.ts` y la usan el agrupador Y el
link "Ver toda la familia", así que no pueden desincronizarse.

**Cuándo reconsiderarla:** si el contenido de un juego crece y sus
familias dejan de ser singletons, conviene bajar la agrupación a familia.

---

## 15. `buildReview` es obligatorio en el manifest

**Por qué:** un juego sin material de repaso desaparecería del estudio en
silencio. Con el campo obligatorio, el compilador lo frena.

**Cuándo reconsiderarla:** con un caso real de juego sin familias en la
mano. No antes.

---

## 16. No hay tests de componentes

**Por qué:** testear el DOM con unit tests es pagar precio de E2E por
información de unit test. La lógica pura está cubierta; la UI se verifica
a mano.

**Honestidad:** el bug del `disabled` que mataba el teclado **no lo
hubiera cazado ninguno de los 126 tests**. Lo encontró jugar sin mouse.

**Cuándo reconsiderarla:** cuando un flujo se vuelva crítico. Ahí va a
Playwright, no a más unit tests contra el DOM.

---

## 17. Dos secciones: pre-práctica y práctica intensiva

**Qué:** la home separa los juegos en dos secciones, por el campo
obligatorio `section` del manifest:

- **Pre-práctica · frase por frase:** los cuatro juegos originales, con
  SRS. Sirven para APRENDER cada punto.
- **Práctica intensiva · formato examen:** el texto completo, como en el
  Part real. Sirve para ENSAYAR: `multiple-choice-cloze-exam`,
  `open-cloze-exam` y `word-formation-exam`. El Part 4 no tiene versión en
  texto porque el examen real ya usa frases sueltas.

**Por qué:** las frases sueltas tienen dos límites. No entrenan a leer el
texto entero (#10), y con un pool fijo llega un momento en que te sabés
todas las posibilidades. Reemplazarlas rompería la granularidad del SRS.
Sumar una sección aparte resuelve los dos sin tocar lo que ya funciona.

**Cómo se mantiene variado sin generar contenido en vivo:** cada texto
trae al menos 10 huecos candidatos (más el ejemplo) y cada intento elige
8. Cada hueco trae de 3 a 5 distractores y muestra 3. Un candidato que
no sale se lee como texto común.

**Descartado: generar los textos con IA en el navegador** (Prompt API /
Gemini Nano). Exige hardware al límite (8 GB en un M1), no anda en el
celular, y un modelo chico produce justo los errores que el validador no
ve: distractores que también son correctos. El contenido curado y
validado gana.

**La sección intensiva no usa `useGameRound` ni SRS.** El examen es
"respondé todo en cualquier orden y corregí al final", que no es el ciclo
pregunta → feedback → siguiente del motor. Torcer el motor para eso
violaría la #1. Los huecos igual llevan ids estables
(`<texto>-<respuesta>`), por si algún día se quieren registrar.

**Lo compartido se extrajo al tercer consumidor** (#12): el formato
"texto con huecos" vive en `exam/gappedText.ts` (marcadores, reglas de
forma, sorteo de 8 en orden de lectura), y el texto y el banner de
resultado en `engine/ui` (`ExamText`, `GapNumber`, `ScoreBanner`), sin
saber inglés. Los componentes de los Parts 2 y 3 se parecen mucho pero
siguen separados: son dos consumidores, y difieren en la raíz y sus
reglas.

**Part 3 en texto: raíces repetidas ≥50%, no 85%.** La mecánica de la #4
vale igual: una raíz tiene que pedir otra forma en otro hueco. Pero cada
raíz tiene que entrar en un texto con tema propio, y forzarlas degrada los
textos. Además, la misma raíz con la misma forma en dos textos está
prohibida por el validador.

**Costo:** el texto se reconoce después de varias vueltas; esto retrasa
la memorización, no la elimina. El remedio es sumar textos, que es barato
porque cada texto es independiente.

**Cuándo reconsiderarla:** si se quiere que los resultados de la sección
intensiva alimenten el repaso. Ahí conviene registrar cada hueco con un
scheduler propio, no mezclarlo con el SRS de la pre-práctica.

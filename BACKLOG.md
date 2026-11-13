# Backlog

Lo que quedó pendiente, ordenado por prioridad. Cada ítem dice qué
problema resuelve, en qué estado está y cuándo se considera terminado.

**Estados:** `Pendiente` · `En curso` · `Hecho` · `Descartado`

Antes de tocar algo que ya tiene una decisión tomada, leé su entrada en
[docs/decisions.md](docs/decisions.md).

---

## 1. Validar el contenido jugándolo

**Estado:** Pendiente · **Prioridad:** alta · **Tipo:** contenido

El contenido nuevo (45 textos y 60 frases del Part 4 · hoja) pasó los
validadores, pero ellos comprueban la FORMA, no si una frase suena natural
ni si entra otra respuesta válida que no está listada. Eso solo se
encuentra jugando.

Dónde es más probable encontrar problemas:

- **Part 2 · texto:** palabras válidas que no figuran en `answers`.
- **Part 1 · texto:** distractores que también serían correctos en ese
  contexto (cualquiera puede salir sorteado).
- **Part 4 (los dos juegos):** respuestas alternativas no listadas, y
  dónde está puesta la barra que separa las dos mitades que puntúan.

**Criterios de aceptación**

- [ ] Jugados los 15 textos de cada Part 1, 2 y 3 al menos una vez.
- [ ] Jugadas al menos 5 hojas del Part 4 · hoja.
- [ ] Revisada la división en mitades de las 100 frases del Part 4
      (40 de pre-práctica y 60 de la hoja).
- [ ] Cada respuesta válida encontrada está agregada a `answers`, o el
      espacio se reescribió para que no sea ambiguo.
- [ ] `npm test` pasa después de cada corrección.

---

## 2. No repetir textos hasta haberlos visto todos

**Estado:** Pendiente · **Prioridad:** alta · **Tipo:** feature

Hoy cada juego de práctica intensiva solo evita repetir el texto (o la
hoja) **inmediatamente anterior**, y eso se pierde al cerrar la pestaña.
Con 15 textos se puede tocar el mismo dos veces en una semana mientras
otro no aparece nunca: se desaprovecha el contenido.

La idea es rotar: no repetir un texto hasta haber pasado por todos, y
recordarlo entre sesiones.

**Criterios de aceptación**

- [ ] En cada juego de práctica intensiva, un texto (o frase del Part 4)
      no vuelve a salir hasta que salieron todos los demás.
- [ ] La rotación se conserva al recargar o cerrar la pestaña.
- [ ] La persistencia pasa por `engine/storage.ts` (la única capa que
      toca `localStorage`), con claves bajo el prefijo `first-class:`.
- [ ] Si lo guardado está corrupto o falta, el juego arranca normal, sin
      romperse (mismo criterio que `storage.test.ts`).
- [ ] Al agregar textos nuevos al JSON, entran en la rotación sin que
      haya que borrar nada.
- [ ] Hay un test que falla si la rotación repite antes de completar la
      vuelta, y se lo vio fallar rompiendo el código.

---

## 3. Bug: en el repaso, grupos de distintos juegos se abren juntos

**Estado:** Hecho · **Prioridad:** media · **Tipo:** bug

La pre-práctica del Part 1 y la del Part 2 agrupan su repaso por
categoría, y las dos tienen grupos llamados `linker` y `preposition`. La
página de repaso decide qué grupo está abierto comparando solo ese id:
en la pestaña **Todo**, abrir "Conectores" del Part 1 abre también el del
Part 2.

Cuidado: cambiar los ids de grupo rompe los links "Ver toda la familia"
que ya existen. El arreglo va en la página de repaso (comparar juego +
grupo), no en los ids.

**Resolución:** `ReviewPage` identifica cada grupo por `juego:grupo`
(`groupKey()`), la misma clave que ya usaba como `key` de React. Los
choques eran cuatro, no dos: Conectores y Preposiciones dependientes
(Part 1 y 2), Comparativos (Part 2 y 4) y Phrasal verbs (Part 1 y 4).

**Criterios de aceptación**

- [x] En la pestaña Todo, abrir un grupo abre solo ese grupo (verificado
      con los 59 grupos, uno por uno).
- [x] Los links "Ver toda la familia →" de los cuatro juegos siguen
      abriendo el grupo correcto (no cambió ningún id ni URL).
- [x] Verificado en el navegador, con el bug reproducido antes del
      arreglo (no hay tests de componentes, ver decisión #16).

---

## 4. Simulacro completo

**Estado:** Pendiente · **Prioridad:** media · **Tipo:** feature

Encadenar los Parts 1 a 4 seguidos, como en el examen real, con reloj y
un puntaje total. Entrena lo que ningún juego suelto entrena: administrar
el tiempo y sostener la concentración a lo largo de toda la sección.

**Criterios de aceptación**

- [ ] Un intento recorre Part 1 → 2 → 3 → 4, en ese orden, reusando el
      contenido de la práctica intensiva.
- [ ] Hay un reloj visible, con el tiempo total configurable o fijo según
      el examen.
- [ ] Al final se muestra el puntaje de cada Part y el total, con la
      puntuación del examen (1 punto por espacio en los Parts 1–3, 0–2
      por frase en el Part 4).
- [ ] No usa repetición espaciada ni repaso, como el resto de la
      práctica intensiva (decisión #17).
- [ ] Se puede abandonar a mitad de camino sin que quede estado roto.
- [ ] Hay una decisión nueva en `docs/decisions.md` que explique dónde
      vive (¿sección propia? ¿juego?) y por qué.

---

## 5. Más contenido para la pre-práctica

**Estado:** Pendiente · **Prioridad:** media · **Tipo:** contenido

El problema que originó todo este trabajo: con el pool fijo de la
pre-práctica (228 ítems), en algún momento te sabés todas las
posibilidades. La práctica intensiva lo resolvió para el formato examen,
pero los juegos de pre-práctica siguen con el mismo contenido.

**Criterios de aceptación**

- [ ] Cada juego de pre-práctica suma al menos 20 ítems nuevos.
- [ ] Part 3: el contenido nuevo suma formas a familias EXISTENTES antes
      que familias nuevas (el invariante de raíz ambigua sigue ≥ 85%).
- [ ] Part 1: el invariante de respuestas que también son distractor
      sigue ≥ 40%.
- [ ] Ningún id existente cambia (son la llave del progreso del usuario).
- [ ] Nada de umbrales bajados para que los tests pasen.

---

## 6. Evaluar un selector propio para el Part 1 · texto

**Estado:** Pendiente · **Prioridad:** baja · **Tipo:** UX

El Part 1 · texto usa un `<select>` nativo dentro de cada espacio. Es
cómodo y accesible, pero las cuatro opciones solo se ven al abrir el
desplegable; en el examen se ven todas juntas, y compararlas es parte de
la habilidad. Primero hay que confirmar jugando si se extraña.

**Criterios de aceptación**

- [ ] Decidido, después de jugarlo, si el `<select>` alcanza o hace falta
      un selector que muestre las cuatro opciones a la vez.
- [ ] Si se cambia: se puede elegir con teclado (Tab y flechas), anda en
      celular con el pulgar y no tapa el texto que se está leyendo.
- [ ] Verificado en el navegador, con teclado y en ancho de celular.

---

## 7. Probar la UI en un celular real

**Estado:** Pendiente · **Prioridad:** baja · **Tipo:** verificación

Todo lo nuevo se verificó en Chrome headless, incluido el ancho de 390 px,
pero no en un dispositivo real: el teclado virtual, el selector nativo del
`<select>` y los inputs dentro del texto se comportan distinto en un
celular de verdad.

**Criterios de aceptación**

- [ ] Jugado un intento completo de cada juego de práctica intensiva en
      un celular (iOS o Android).
- [x] La barra de "Corregir" sigue disponible después de escribir. Fallaba:
      se escondía con el foco y no volvía al cerrar el teclado (arreglado,
      ver `docs/gotchas.md` #9).
- [ ] El teclado virtual no tapa el espacio que se está completando.
- [ ] Enter / "Siguiente" del teclado del celular avanza al próximo
      espacio.
- [ ] Sin scroll horizontal ni textos cortados.

---

## 8. Unificar el vocabulario: "espacio" también en código y docs

**Estado:** Pendiente · **Prioridad:** baja · **Tipo:** mantenimiento

La UI dice "espacio" en todos lados, pero los comentarios del código, la
documentación interna y los mensajes de error de los validadores siguen
diciendo "hueco". No afecta a quien juega; sí a quien escribe contenido,
que ve dos palabras para lo mismo.

**Criterios de aceptación**

- [ ] Ningún comentario, doc ni mensaje de error usa "hueco".
- [ ] Los tests que buscan texto de un mensaje de error siguen pasando
      (actualizados si hace falta).
- [ ] No cambian identificadores de código (`gap`, `GapNumber`…), que
      están en inglés.

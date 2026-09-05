# Agregar contenido

**El cuello de botella de este proyecto no es el código: es el
contenido.** Con 228 ítems y repetición espaciada rinde bastante, pero el
pool es el límite real.

Esta es la tarea que más se va a repetir. Leé los invariantes antes de
escribir: el validador te va a frenar igual, pero es más barato saberlo
antes.

---

## Reglas que valen para los cuatro juegos

- **El hueco nunca abre la frase.** Si abriera, la respuesta iría en
  mayúscula y eso sería la pista.
- **Los ids son semánticos y estables** (`clear-clarity`, no `42`). Ver
  [decisiones #3](decisions.md). Cambiar un id le borra el progreso a
  quien lo estaba estudiando.
- **Todo en minúscula y normalizado** en las respuestas.
- **Dos ítems de la misma familia no pueden aceptar la misma respuesta.**
  El validador lo rechaza con los dos culpables nombrados.
- Las frases son largas y con contexto real (25–35 palabras): el examen
  no da huecos sueltos sin pistas alrededor.

## Dónde tocar

```
src/games/<juego>/questions.json    ← el contenido
src/games/<juego>/questions.ts      ← el validador (leelo antes)
```

Después: `npm test`. Si algo está mal, el mensaje dice qué y en qué ítem.

---

## Part 3 — Word Formation

**El invariante que importa:** sumá formas a familias EXISTENTES antes
que familias nuevas de un solo ítem.

```json
{
  "id": "create-creativity",
  "family": "create",
  "root": "CREATE",
  "category": "noun",
  "label": "Sustantivo (-ivity)",
  "level": 2,
  "sentence": "What impressed the judges most was not her technique but the sheer ___ she showed.",
  "answers": ["creativity"],
  "explanation": "CREATE → creativity. Después de 'the sheer' va un sustantivo abstracto."
}
```

Hay un test que falla si menos del **85%** de los ítems tiene raíz
ambigua. Es la mecánica central: si `CREATE` tuviera una sola respuesta,
el jugador memoriza el par y deja de leer la frase.

`root` no siempre es igual a `family`: la familia `friend` se puede pedir
desde `FRIEND` o desde `FRIENDLY`.

---

## Part 4 — Key Word Transformation

**El error más traicionero:** que la palabra clave quede FUERA del hueco.
La frase se lee perfecta y el ítem es inválido. Ya pasó una vez; el
validador lo caza.

```json
{
  "id": "passive-report-is-said-to-be",
  "family": "passive-report",
  "category": "passive",
  "label": "Pasiva impersonal",
  "level": 3,
  "original": "People say that he is extremely wealthy.",
  "keyWord": "SAID",
  "gapped": "He ___ extremely wealthy.",
  "answers": ["is said to be"],
  "explanation": "Estructura impersonal: sujeto + is said + to + infinitivo."
}
```

- Entre **2 y 5 palabras**, contadas como Cambridge: `aren't` = 2.
- La respuesta debe **contener la palabra clave sin modificarla**.
- Reutilizá palabras clave entre estructuras distintas, para que no se
  memorice `clave → respuesta`.

---

## Part 1 — Multiple-choice Cloze

**Los distractores SON el ejercicio.** Un distractor obviamente malo
convierte la pregunta en regalo; uno que también es correcto castiga al
que sabe.

```json
{
  "id": "do-vs-make-decision",
  "family": "do-vs-make",
  "category": "collocation",
  "label": "make + decision",
  "level": 1,
  "sentence": "After months of discussion they finally ___ a decision to move abroad.",
  "answer": "made",
  "distractors": ["did", "held", "gave"],
  "explanation": "'make a decision': la decisión se PRODUCE, no se ejecuta."
}
```

Distractores descartados durante la escritura por ser **también
válidos**: `took a decision` (correcto en inglés británico),
`earned a profit`, `ran across a photograph`, `put off the match`
(significa posponer, y el contexto no lo excluía).

Test: al menos el **40%** de las respuestas debe aparecer también como
distractor en otro ítem, para que ninguna palabra sea "siempre la buena".

---

## Part 2 — Open Cloze

Casi nunca pide vocabulario: pide **las palabras que sostienen la
gramática** (artículos, preposiciones, auxiliares, frases hechas).

```json
{
  "id": "linker-although-although",
  "family": "linker-although",
  "category": "linker",
  "label": "although / though",
  "level": 1,
  "sentence": "He plays like a professional ___ he is only fourteen years old.",
  "answers": ["although", "though"],
  "explanation": "ALTHOUGH introduce una oración con sujeto y verbo. DESPITE no puede."
}
```

- **UNA sola palabra**, contada como Cambridge: nada de contracciones
  (`don't` son dos).
- Varias respuestas válidas es normal acá (`although` / `though`).

---

## Generar en lote

Para tandas grandes conviene un script que valide ANTES de escribir el
JSON. El patrón que se usó en las cuatro partes:

```python
problems, out = [], []
for family, slug, cat, label, level, sentence, answers, expl in ITEMS:
    qid = f"{family}-{slug}"
    if "___" not in sentence: problems.append(f"{qid}: sin hueco")
    if sentence.strip().startswith("___"): problems.append(f"{qid}: hueco al inicio")
    # ... el resto de los invariantes
if problems:
    print("PROBLEMAS:"); [print(" -", p) for p in problems]; sys.exit(1)
```

**Advertencia sobre generar con un LLM:** te escribe 500 ítems en una
tarde y 400 son mediocres — colocaciones poco naturales, frases donde
entran DOS respuestas válidas, dificultad mal calibrada. Para preparar un
examen, calidad > cantidad. Hay que revisar a mano.

**Y no copies exámenes reales de Cambridge.** Están protegidos. Usalos
como referencia de estilo y escribí originales.

---

## Después de agregar

```bash
npm test      # valida datasets e invariantes pedagógicos
npm run dev   # jugá una ronda de lo que agregaste
```

Jugarlo importa: el validador comprueba la forma, no si la frase suena
natural ni si hay dos respuestas posibles.

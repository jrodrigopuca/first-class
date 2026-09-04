import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import questionsData from "./questions.json";

// Fisher–Yates shuffle (no muta el array original)
function shuffle(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Juego de word formation estilo B2 First (Part 3).
 *
 * Props:
 * - questions:   array de preguntas. Por defecto usa ./questions.json.
 *                Esquema de cada pregunta:
 *                { id, category, label, level, sentence, root, answers[], explanation }
 * - roundLength: cuántas preguntas por partida (por defecto 15).
 * - category:    opcional, filtra por categoría ("noun" | "adjective" |
 *                "adverb" | "prefix" | "verb" | "person").
 */
export default function WordFormationGame({
  questions = questionsData,
  roundLength = 15,
  category = null,
}) {
  const pool = useMemo(
    () => (category ? questions.filter((q) => q.category === category) : questions),
    [questions, category]
  );

  const buildRound = useCallback(
    () => shuffle(pool).slice(0, Math.min(roundLength, pool.length)),
    [pool, roundLength]
  );

  const [round, setRound] = useState(buildRound);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [mistakes, setMistakes] = useState([]);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef(null);

  const question = round[index];

  useEffect(() => {
    if (!answered && !finished) inputRef.current?.focus();
  }, [index, answered, finished]);

  const restart = () => {
    setRound(buildRound());
    setIndex(0);
    setInput("");
    setError(false);
    setAnswered(false);
    setCorrect(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setMistakes([]);
    setFinished(false);
  };

  const check = () => {
    const value = input.trim().toLowerCase();
    if (!value) {
      setError(true);
      return;
    }
    const isCorrect = question.answers.includes(value);
    setAnswered(true);
    setCorrect(isCorrect);
    if (isCorrect) {
      setScore((s) => s + (streak >= 3 ? 15 : 10));
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
      setMistakes((m) => [...m, question]);
    }
  };

  const next = () => {
    if (index < round.length - 1) {
      setIndex((i) => i + 1);
      setInput("");
      setAnswered(false);
      setCorrect(false);
    } else {
      setFinished(true);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") (answered ? next : check)();
  };

  const total = round.length;
  const correctCount = total - mistakes.length;
  const progress = finished ? 100 : (index / total) * 100;

  if (pool.length === 0) {
    return (
      <div className="max-w-xl mx-auto p-6 text-center text-gray-500">
        No hay preguntas para esta categoría. Añade más entradas a questions.json.
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 font-sans text-gray-900">
      {/* Marcadores */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500 m-0">Puntos</p>
            <p className="text-xl font-medium m-0">{score}</p>
          </div>
          <div className="bg-gray-100 rounded-lg px-4 py-2">
            <p className="text-xs text-gray-500 m-0">Racha</p>
            <p className="text-xl font-medium m-0">{streak}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {finished ? `${total} / ${total}` : `${index + 1} / ${total}`}
        </p>
      </div>

      {/* Barra de progreso */}
      <div className="h-1 bg-gray-100 rounded-full mb-5 overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {finished ? (
        /* Pantalla final */
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-lg font-medium mb-1">
            {correctCount} de {total} correctas · {score} puntos
          </p>
          <p className="text-sm text-gray-500 mb-4">
            {correctCount >= total * 0.85
              ? "¡Nivel examen! Estás más que listo para el Part 3."
              : correctCount >= total * 0.6
              ? `¡Muy bien! Mejor racha: ${bestStreak}. Repasa los fallos y a por todas.`
              : `Buen intento. Mejor racha: ${bestStreak}. La práctica hace al maestro.`}
          </p>
          {mistakes.length > 0 && (
            <div className="text-left bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium mb-2">Para repasar:</p>
              <ul className="text-sm text-gray-600 space-y-1 list-none p-0 m-0">
                {mistakes.map((q) => (
                  <li key={q.id}>
                    {q.root} → <span className="font-medium">{q.answers[0]}</span>
                    <span className="text-gray-400"> · {q.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={restart}
            className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 active:scale-95 transition text-sm font-medium"
          >
            Jugar otra vez
          </button>
        </div>
      ) : (
        /* Pregunta activa */
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-base leading-relaxed mb-4">{question.sentence}</p>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Palabra raíz:</span>
            <span className="font-mono text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg">
              {question.root}
            </span>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={input}
            disabled={answered}
            placeholder="Escribe la forma correcta"
            autoComplete="off"
            autoCapitalize="off"
            onChange={(e) => {
              setInput(e.target.value);
              setError(false);
            }}
            onKeyDown={handleKeyDown}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 mb-1"
          />
          {error && (
            <p className="text-sm text-red-600 mb-1">Escribe una respuesta primero</p>
          )}

          {answered && (
            <div
              className={`rounded-lg px-4 py-3 my-2 ${
                correct ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
              }`}
            >
              <p className="text-sm font-medium m-0">
                {correct
                  ? streak >= 4
                    ? `¡Correcto! Racha x${streak} (+15)`
                    : "¡Correcto! (+10)"
                  : `La respuesta era: ${question.answers[0]}`}
              </p>
              <p className="text-xs font-medium uppercase tracking-wide mt-1 mb-1 opacity-80">
                {question.label}
              </p>
              <p className="text-sm m-0 leading-relaxed">{question.explanation}</p>
            </div>
          )}

          <button
            onClick={answered ? next : check}
            className="w-full mt-3 px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 active:scale-95 transition text-sm font-medium"
          >
            {answered
              ? index < total - 1
                ? "Siguiente"
                : "Ver resultado"
              : "Comprobar"}
          </button>
        </div>
      )}
    </div>
  );
}
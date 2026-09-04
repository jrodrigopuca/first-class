/**
 * Fisher–Yates. Devuelve un array nuevo: no muta la entrada.
 * Que reciba `readonly` no es adorno — es el compilador impidiéndote
 * mutar el dataset original por accidente.
 */
export function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = copy[i] as T;
    const b = copy[j] as T;
    copy[i] = b;
    copy[j] = a;
  }
  return copy;
}

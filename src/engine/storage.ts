import type { ItemProgress, ProgressMap } from "./types";

/**
 * Persistencia del progreso, namespaceada POR JUEGO.
 *
 * ¿Por qué localStorage y no IndexedDB? Porque son ~10 KB de números.
 * localStorage es síncrono, así que el progreso está disponible en el
 * primer render y no hace falta estado de carga en ningún componente.
 * IndexedDB sería la respuesta correcta con datos grandes o consultas
 * estructuradas; acá solo agregaría asincronía sin comprar nada.
 *
 * Límite honesto: localStorage vive en ESTE navegador. Si querés
 * estudiar en el celular y en la notebook con el mismo progreso, hace
 * falta un backend. Hoy no lo hay y es una decisión consciente.
 */

const KEY_PREFIX = "first-class";
const SCHEMA_VERSION = 1;

interface StoredProgress {
  version: number;
  items: Record<string, ItemProgress>;
}

function storageKey(gameId: string): string {
  return `${KEY_PREFIX}:${gameId}:progress`;
}

function isItemProgress(value: unknown): value is ItemProgress {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item["box"] === "number" &&
    typeof item["dueAt"] === "number" &&
    typeof item["lastSeenAt"] === "number" &&
    typeof item["attempts"] === "number" &&
    typeof item["hits"] === "number"
  );
}

/**
 * Lee y VALIDA. Nunca confía en lo que hay guardado.
 *
 * Lo de adentro del localStorage lo escribió una versión anterior de
 * esta app, o una extensión, o el usuario abriendo la consola. Si la
 * forma no es la esperada, se empieza de cero: perder progreso es malo,
 * pero mucho menos malo que romper la app en cada carga sin que el
 * usuario pueda salir de ahí.
 */
function readRaw(gameId: string): string | null {
  try {
    return window.localStorage.getItem(storageKey(gameId));
  } catch {
    // Modo incógnito o storage bloqueado: se juega sin memoria.
    return null;
  }
}

export function loadProgress(gameId: string): ProgressMap {
  const raw = readRaw(gameId);
  if (raw === null) return {};

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};

    const stored = parsed as Partial<StoredProgress>;
    if (stored.version !== SCHEMA_VERSION) return {};
    if (typeof stored.items !== "object" || stored.items === null) return {};

    const items: Record<string, ItemProgress> = {};
    for (const [id, value] of Object.entries(stored.items)) {
      if (isItemProgress(value)) items[id] = value;
    }
    return items;
  } catch {
    return {};
  }
}

export function saveProgress(gameId: string, items: ProgressMap): void {
  const payload: StoredProgress = { version: SCHEMA_VERSION, items: { ...items } };
  try {
    window.localStorage.setItem(storageKey(gameId), JSON.stringify(payload));
  } catch {
    // Cuota llena o storage bloqueado: la partida sigue, sin recordarse.
  }
}

export function clearProgress(gameId: string): void {
  try {
    window.localStorage.removeItem(storageKey(gameId));
  } catch {
    // Nada que hacer.
  }
}

// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearProgress, loadProgress, saveProgress } from "./storage";
import type { ItemProgress } from "./types";

/*
 * El contrato de este módulo es "nunca confíes en lo que hay guardado".
 * Lo de adentro del localStorage lo escribió una versión vieja de la app,
 * una extensión, o el usuario desde la consola. Si romperse significara
 * crashear en cada carga, el usuario quedaría encerrado sin salida.
 */

const KEY = "first-class:word-formation:progress";
const item: ItemProgress = { box: 3, dueAt: 1000, lastSeenAt: 900, attempts: 4, hits: 3 };

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("ida y vuelta", () => {
  it("recupera lo que guardó", () => {
    saveProgress("word-formation", { "clear-clarity": item });

    expect(loadProgress("word-formation")).toEqual({ "clear-clarity": item });
  });

  it("devuelve vacío para un juego que nunca se jugó", () => {
    expect(loadProgress("open-cloze")).toEqual({});
  });
});

describe("aislamiento entre juegos", () => {
  it("escribe cada juego en su propia clave", () => {
    saveProgress("word-formation", { "clear-clarity": item });
    saveProgress("key-word-transformation", { "passive-was-stolen": item });

    const keys = Array.from({ length: window.localStorage.length }, (_, i) =>
      window.localStorage.key(i),
    ).sort();

    expect(keys).toEqual([
      "first-class:key-word-transformation:progress",
      "first-class:word-formation:progress",
    ]);
  });

  it("no deja que un juego lea el progreso de otro", () => {
    saveProgress("word-formation", { "clear-clarity": item });

    expect(loadProgress("key-word-transformation")).toEqual({});
  });

  it("borra solo el progreso del juego indicado", () => {
    saveProgress("word-formation", { "clear-clarity": item });
    saveProgress("key-word-transformation", { "passive-was-stolen": item });

    clearProgress("word-formation");

    expect(loadProgress("word-formation")).toEqual({});
    expect(loadProgress("key-word-transformation")).toEqual({ "passive-was-stolen": item });
  });
});

describe("datos corruptos", () => {
  it("empieza de cero si el JSON no se puede parsear", () => {
    window.localStorage.setItem(KEY, "{ esto no es json");

    expect(loadProgress("word-formation")).toEqual({});
  });

  it("descarta el progreso de una versión de esquema que no conoce", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ version: 99, items: { "clear-clarity": item } }),
    );

    expect(loadProgress("word-formation")).toEqual({});
  });

  it("descarta un payload que no es un objeto", () => {
    window.localStorage.setItem(KEY, JSON.stringify("una string suelta"));

    expect(loadProgress("word-formation")).toEqual({});
  });

  it("filtra los ítems con forma inválida y conserva los sanos", () => {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        version: 1,
        items: {
          sano: item,
          sinCaja: { dueAt: 1, lastSeenAt: 1, attempts: 1, hits: 1 },
          cajaEnTexto: { ...item, box: "tres" },
          nulo: null,
        },
      }),
    );

    expect(loadProgress("word-formation")).toEqual({ sano: item });
  });
});

describe("almacenamiento no disponible", () => {
  it("juega sin memoria si leer lanza, en vez de crashear", () => {
    // Safari en navegación privada hace exactamente esto.
    vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
      throw new DOMException("acceso denegado");
    });

    expect(() => loadProgress("word-formation")).not.toThrow();
    expect(loadProgress("word-formation")).toEqual({});
  });

  it("no interrumpe la partida si escribir lanza por cuota llena", () => {
    vi.spyOn(window.localStorage, "setItem").mockImplementation(() => {
      throw new DOMException("cuota excedida");
    });

    expect(() => saveProgress("word-formation", { "clear-clarity": item })).not.toThrow();
  });
});

/**
 * Node 25 trae un `localStorage` global propio que choca con el de jsdom
 * y deja un objeto sin métodos. Acá se instala un Storage en memoria
 * fiel a la spec cuando el entorno no ofrece uno usable.
 *
 * Mockear localStorage es legítimo: es un boundary del navegador que no
 * nos pertenece. Lo que se testea es NUESTRA lógica de namespacing y de
 * validación, no la implementación de storage del browser — eso se
 * verificó a mano contra Chrome.
 */

class MemoryStorage implements Storage {
  #entries = new Map<string, string>();

  get length(): number {
    return this.#entries.size;
  }

  key(index: number): string | null {
    return [...this.#entries.keys()][index] ?? null;
  }

  getItem(key: string): string | null {
    return this.#entries.get(String(key)) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#entries.set(String(key), String(value));
  }

  removeItem(key: string): void {
    this.#entries.delete(String(key));
  }

  clear(): void {
    this.#entries.clear();
  }

  [name: string]: unknown;
}

const usable =
  typeof globalThis.window !== "undefined" &&
  typeof globalThis.window.localStorage?.setItem === "function";

if (typeof globalThis.window !== "undefined" && !usable) {
  Object.defineProperty(globalThis.window, "localStorage", {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  });
}

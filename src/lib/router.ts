import { useSyncExternalStore } from "react";

/**
 * Router mínimo basado en el hash de la URL.
 *
 * ¿Por qué a mano y no una librería? Porque un router hace exactamente
 * tres cosas: leer la URL, avisar cuando cambia, y dejarte navegar.
 * Eso son 25 líneas. React Router resuelve rutas anidadas, loaders,
 * transiciones y data fetching — nada de lo cual usamos acá.
 *
 * ¿Por qué hash y no History API? Porque `#/games/x` no le pide NADA
 * al servidor: se despliega en cualquier hosting estático (GitHub Pages
 * incluido) sin configurar rewrites. Con pushState, un F5 en una ruta
 * profunda te da 404 salvo que configures el server.
 */

const ROOT_PATH = "/";

function subscribe(onStoreChange: () => void): () => void {
  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function readPath(): string {
  const hash = window.location.hash.slice(1);
  return hash.startsWith(ROOT_PATH) ? hash : ROOT_PATH;
}

/** Ruta actual, reactiva. Re-renderiza al cambiar el hash. */
export function useRoutePath(): string {
  return useSyncExternalStore(subscribe, readPath, () => ROOT_PATH);
}

/** El href que va en un <a>. Ancla nativa = atrás, ctrl+click y hover gratis. */
export function toHref(path: string): string {
  return `#${path}`;
}

/** Navegación imperativa, para cuando no hay un <a> de por medio. */
export function navigate(path: string): void {
  window.location.hash = path;
}

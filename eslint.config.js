import js from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", ".archive", "node_modules"] },

  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },

  // Los archivos de test no exportan componentes ni persisten nada.
  {
    files: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": "off",
    },
  },

  /*
   * Un solo módulo puede tocar el almacenamiento del navegador.
   *
   * Si un juego llamara a localStorage por su cuenta, elegiría su propia
   * clave — y ahí se evapora el namespacing por juego. El progreso se
   * guarda a través de engine/storage.ts o no se guarda.
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: [
      "src/engine/storage.ts",
      // El test del módulo de storage necesita armar el escenario en el
      // storage real; el setup instala el doble en memoria. Son los dos
      // únicos lugares legítimos, y por eso están nombrados uno por uno.
      "src/engine/storage.test.ts",
      "src/setupTests.ts",
    ],
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "localStorage",
          message: "El progreso se persiste con engine/storage.ts, que namespacea por juego.",
        },
        {
          name: "sessionStorage",
          message: "El progreso se persiste con engine/storage.ts, que namespacea por juego.",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          object: "window",
          property: "localStorage",
          message: "El progreso se persiste con engine/storage.ts, que namespacea por juego.",
        },
        {
          object: "window",
          property: "sessionStorage",
          message: "El progreso se persiste con engine/storage.ts, que namespacea por juego.",
        },
      ],
    },
  },

  /*
   * Aislamiento entre juegos, ENFORZADO por el linter.
   *
   * Esto convierte "los juegos no comparten información" de promesa
   * en garantía. Un comentario en el README no frena a nadie un viernes
   * a las 8 de la noche; un error de lint sí.
   *
   * Capas, de abajo hacia arriba:
   *   lib      -> utilidades puras, no importan nada
   *   engine   -> el motor y su UI; puede usar lib
   *   game     -> un juego; puede usar engine y lib, y SOLO a sí mismo
   *   registry -> la única capa que conoce a todos los juegos
   *   app      -> la cáscara; conoce el registry, nunca un juego concreto
   */
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["src/**/*"],
      "boundaries/elements": [
        { type: "lib", pattern: "src/lib/**", partialMatch: false },
        { type: "engine", pattern: "src/engine/**", partialMatch: false },
        { type: "game", pattern: "src/games/*/**", partialMatch: false, capture: ["game"] },
        { type: "registry", pattern: "src/registry/**", partialMatch: false },
        { type: "app", pattern: "src/app/**", partialMatch: false },
        { type: "root", pattern: "src/*", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          message: "'{{from.type}}' no puede importar de '{{to.type}}'",
          policies: [
            {
              from: [{ element: { type: "root" } }],
              allow: [
                { to: { element: { type: "app" } } },
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "lib" } } },
              ],
            },
            {
              from: [{ element: { type: "app" } }],
              allow: [
                { to: { element: { type: "app" } } },
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "lib" } } },
                { to: { element: { type: "registry" } } },
              ],
            },
            {
              from: [{ element: { type: "registry" } }],
              allow: [
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "game" } } },
              ],
            },
            {
              from: [{ element: { type: "game" } }],
              allow: [
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "lib" } } },
                // La captura obliga a que el nombre de carpeta destino
                // sea EL MISMO que el de origen. Un juego solo se importa
                // a sí mismo.
                { to: { element: { type: "game", captured: { game: "{{from.game}}" } } } },
              ],
              message:
                "Juegos aislados: '{{from.game}}' no puede importar de '{{to.game}}'",
            },
            {
              from: [{ element: { type: "engine" } }],
              allow: [
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "lib" } } },
              ],
            },
            {
              from: [{ element: { type: "lib" } }],
              allow: [{ to: { element: { type: "lib" } } }],
            },
          ],
        },
      ],
    },
  },
);

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
   * Reglas de CAPA, enforzadas sobre el string del import.
   *
   * Aburrido a propósito: no-restricted-imports es una regla del core de
   * ESLint que mira el texto del import y nada más. No resuelve archivos,
   * no clasifica elementos, no puede fallar en silencio.
   *
   * Los patrones enumeran las profundidades relativas que existen en este
   * proyecto (../ y ../../) en vez de usar ** — porque ** no matchea ".."
   * salvo que el matcher tenga dot:true, y depender de ese detalle sería
   * volver al mismo problema.
   */
  {
    files: ["src/engine/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../exam/*", "../../exam/*",
                "../games/*", "../../games/*", "../games/*/*", "../../games/*/*",
                "../app/*", "../../app/*",
                "../registry", "../../registry",
              ],
              message:
                "El motor no sabe inglés ni conoce juegos concretos: esa ignorancia es lo que le permite servir a cualquiera. Solo puede usar lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/lib/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../engine/*", "../../engine/*",
                "../exam/*", "../../exam/*",
                "../games/*", "../../games/*", "../games/*/*", "../../games/*/*",
                "../app/*", "../../app/*",
                "../registry", "../../registry",
              ],
              message: "lib es la capa de abajo de todo: utilidades puras que no importan nada del proyecto.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/exam/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../engine/*", "../../engine/*",
                "../games/*", "../../games/*", "../games/*/*", "../../games/*/*",
                "../app/*", "../../app/*",
                "../registry", "../../registry",
              ],
              message: "exam son reglas del examen: no sabe de rondas, de puntaje ni de juegos concretos. Solo puede usar lib.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "../games/*", "../../games/*", "../games/*/*", "../../games/*/*",
                "../exam/*", "../../exam/*",
              ],
              message: "La cáscara conoce el registry, nunca un juego concreto ni las reglas del examen.",
            },
          ],
        },
      ],
    },
  },

  /*
   * Aislamiento entre juegos, ENFORZADO por el linter.
   *
   * LÍMITE MEDIDO, no supuesto: eslint-plugin-boundaries solo resuelve
   * como dependencia lo que cae bajo `src/games/*`. Un import a
   * src/engine, src/lib o src/exam le queda como "unknown element" y la
   * regla no dispara — comprobado con boundaries/no-unknown.
   *
   * O sea: de todo este bloque, lo único que realmente se ejecuta es la
   * política de juego contra juego. Es justo la que importa y está
   * verificada rompiéndola a propósito. Las reglas de CAPAS se enforzan
   * más abajo con no-restricted-imports, que trabaja sobre el string del
   * import y no depende de que ninguna librería resuelva nada.
   *
   * Esto convierte "los juegos no comparten información" de promesa
   * en garantía. Un comentario en el README no frena a nadie un viernes
   * a las 8 de la noche; un error de lint sí.
   *
   * Capas, de abajo hacia arriba:
   *   lib      -> utilidades puras, no importan nada
   *   exam     -> reglas del B2 First (contar palabras, normalizar)
   *   engine   -> el motor y su UI; puede usar lib. NO usa exam: el
   *               motor no sabe inglés, y esa ignorancia es lo que le
   *               permite servir a cualquier juego
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
        { type: "exam", pattern: "src/exam/**", partialMatch: false },
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
              from: [{ element: { type: "exam" } }],
              allow: [
                { to: { element: { type: "exam" } } },
                { to: { element: { type: "lib" } } },
              ],
            },
            {
              from: [{ element: { type: "game" } }],
              allow: [
                { to: { element: { type: "engine" } } },
                { to: { element: { type: "exam" } } },
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

/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  /*
   * La app no vive en la raíz del dominio sino en
   * https://jrodrigopuca.github.io/first-class/
   *
   * Sin esto, el HTML pediría /assets/... y GitHub devolvería 404 en
   * todo. Con base, los pide en /first-class/assets/...
   *
   * El router por hash que elegimos en la primera sesión se paga acá:
   * como todas las rutas son #/..., el servidor solo sirve un index.html
   * y no hace falta configurar ningún rewrite.
   */
  base: "/first-class/",
  plugins: [
    // React Compiler: memoiza automáticamente lo que antes envolvías a mano.
    // Por eso en todo este proyecto no vas a encontrar un solo
    // useMemo ni useCallback escrito por nosotros.
    react({ compiler: true }),
  ],
  test: {
    // node por defecto: los tests de lógica pura no necesitan DOM y
    // arrancan mucho más rápido. Los que sí lo necesitan lo piden con
    // un // @vitest-environment jsdom arriba del archivo.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/setupTests.ts"],
  },
  css: {
    modules: {
      // Clases legibles mientras desarrollás, hasheadas en producción.
      generateScopedName:
        process.env.NODE_ENV === "production"
          ? "[hash:base64:6]"
          : "[name]__[local]__[hash:base64:4]",
    },
  },
});

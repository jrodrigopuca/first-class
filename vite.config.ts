/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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

/**
 * Constantes de las variantes de UI, separadas de los componentes.
 * ¿Por qué un archivo aparte? Porque Fast Refresh de Vite solo puede
 * recargar en caliente un módulo que exporta ÚNICAMENTE componentes.
 * Mezclar constantes ahí te rompe el HMR.
 */

export const BUTTON_VARIANT = {
  PRIMARY: "primary",
  GHOST: "ghost",
} as const;

export type ButtonVariant = (typeof BUTTON_VARIANT)[keyof typeof BUTTON_VARIANT];

export const FEEDBACK_TONE = {
  SUCCESS: "success",
  ERROR: "error",
} as const;

export type FeedbackTone = (typeof FEEDBACK_TONE)[keyof typeof FEEDBACK_TONE];

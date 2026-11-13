/**
 * Las marcas de la birome: una ✓ y una ✗ trazadas a mano. Decorativas
 * (aria-hidden): quien las usa pone al lado el texto para el lector de
 * pantalla ("correcto", "incorrecto"). El color sale de `currentColor`.
 */

interface MarkProps {
  className?: string | undefined;
}

export function Tick({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M2.5 12.8c1.7 1.3 3.4 3.4 5.1 6.4C10.9 12.4 15.2 7.4 21.6 3.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Cross({ className }: MarkProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M5 4.6c4.3 4.4 9 9.6 14.2 14.6M19.2 4.2C14.6 8.8 9.6 14 4.6 19.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** La flecha de los links y las filas. */
export function Arrow({ className }: MarkProps) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path
        d="M4 10h11M11 5.5 15.5 10 11 14.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

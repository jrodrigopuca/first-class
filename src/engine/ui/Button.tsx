import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";
import { BUTTON_VARIANT, type ButtonVariant } from "./constants";
import styles from "./Button.module.css";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant | undefined;
  block?: boolean | undefined;
}

export function Button({
  variant = BUTTON_VARIANT.PRIMARY,
  block = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      // type explícito: sin esto, un botón dentro de un <form> hace submit
      // y te recarga la página. El default del HTML es "submit", no "button".
      type="button"
      className={clsx(styles.button, styles[variant], block && styles.block, className)}
      {...props}
    />
  );
}

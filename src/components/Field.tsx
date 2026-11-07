import type { ReactNode } from "react";
import styles from "./ui.module.css";

export function Field({
  id,
  label,
  optional,
  error,
  hint,
  wide,
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: string;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={wide ? styles.wideField : styles.field}>
      <label htmlFor={id}>
        {label}{" "}
        {optional ? (
          <span className={styles.optional}>(không bắt buộc)</span>
        ) : (
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && (
        <span className={styles.hint} id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className={styles.fieldError} id={`${id}-error`}>
          {error}
        </span>
      )}
    </div>
  );
}

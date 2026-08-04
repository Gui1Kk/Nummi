import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;

export const passwordSchema = z.string()
  .min(PASSWORD_MIN_LENGTH, `Use pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`)
  .max(128, "A senha é longa demais.")
  .regex(/[a-z]/, "Inclua uma letra minúscula.")
  .regex(/[A-Z]/, "Inclua uma letra maiúscula.")
  .regex(/[0-9]/, "Inclua um número.");

export function passwordChecks(value: string) {
  return [
    { label: `${PASSWORD_MIN_LENGTH}+ caracteres`, ok: value.length >= PASSWORD_MIN_LENGTH },
    { label: "letra minúscula", ok: /[a-z]/.test(value) },
    { label: "letra maiúscula", ok: /[A-Z]/.test(value) },
    { label: "número", ok: /[0-9]/.test(value) }
  ];
}

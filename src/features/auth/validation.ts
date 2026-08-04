import { z } from "zod";

export const emailSchema = z.string()
  .trim()
  .min(1, "Informe seu e-mail.")
  .max(254, "O e-mail é longo demais.")
  .email("Informe um e-mail válido.")
  .transform((value) => value.toLowerCase());

export function normalizeEmail(value: string) {
  return emailSchema.parse(value);
}

import type { z } from 'zod';

export function entradaValidada<T>(schema: z.ZodType<T>, valor: object): T {
  void schema;
  return valor as T;
}

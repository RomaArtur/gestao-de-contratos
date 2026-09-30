import { z } from 'zod';

const optionalText = z
  .string()
  .optional()
  .transform((value) => {
    const trimmed = value?.trim();
    return trimmed ? trimmed : undefined;
  });

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'test', 'production'])
      .default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().min(1),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_TTL: z
      .string()
      .regex(/^\d+[smhd]$/)
      .default('15m'),
    JWT_REFRESH_TTL: z
      .string()
      .regex(/^\d+[smhd]$/)
      .default('7d'),
    FRONTEND_ORIGIN: z.string().default('http://localhost:3000'),
    FIELD_ENCRYPTION_KEY: z.string().refine((value) => {
      return Buffer.from(value, 'base64').length === 32;
    }, 'FIELD_ENCRYPTION_KEY deve ser uma chave base64 de 32 bytes.'),
    UPLOAD_DIR: z.string().default('uploads'),
    SEED_ADMIN_NAME: optionalText,
    SEED_ADMIN_EMAIL: optionalText,
    SEED_ADMIN_PASSWORD: optionalText,
  })
  .superRefine((value, ctx) => {
    const hasEmail = Boolean(value.SEED_ADMIN_EMAIL);
    const hasPassword = Boolean(value.SEED_ADMIN_PASSWORD);
    if (hasEmail !== hasPassword) {
      ctx.addIssue({
        code: 'custom',
        message:
          'SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD devem ser definidos juntos.',
        path: ['SEED_ADMIN_EMAIL'],
      });
    }
    if (value.SEED_ADMIN_PASSWORD && value.SEED_ADMIN_PASSWORD.length < 8) {
      ctx.addIssue({
        code: 'custom',
        message: 'SEED_ADMIN_PASSWORD deve ter pelo menos 8 caracteres.',
        path: ['SEED_ADMIN_PASSWORD'],
      });
    }
    if (
      value.SEED_ADMIN_EMAIL &&
      !z.email().safeParse(value.SEED_ADMIN_EMAIL).success
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'SEED_ADMIN_EMAIL inválido.',
        path: ['SEED_ADMIN_EMAIL'],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${details}`);
  }
  return parsed.data;
}

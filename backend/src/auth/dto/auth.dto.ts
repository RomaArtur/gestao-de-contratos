import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export class LoginDto extends createZodDto(loginSchema) {}
export class RefreshDto extends createZodDto(refreshSchema) {}

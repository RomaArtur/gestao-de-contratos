import type { Request } from 'express';
import type { AuthenticatedUser } from '../auth/current-user.decorator.js';

export type Ator = { usuarioId: string; ip?: string; userAgent?: string };

export function atorDe(usuario: AuthenticatedUser, request: Request): Ator {
  const userAgent = request.headers['user-agent'];
  return {
    usuarioId: usuario.id,
    ip: request.ip,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  };
}

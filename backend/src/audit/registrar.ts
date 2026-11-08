import type { Ator } from '../comum/ator.js';
import type { AuditWriter } from './audit-entry.js';

export function registrarAuditoria(
  audit: AuditWriter,
  ator: Ator,
  action: string,
  entity: string,
  entityId: string,
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null,
) {
  return audit.record({
    userId: ator.usuarioId,
    action,
    entity,
    entityId,
    oldValues,
    newValues,
    ip: ator.ip ?? null,
    userAgent: ator.userAgent ?? null,
  });
}

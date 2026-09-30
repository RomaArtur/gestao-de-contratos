export type AuditEntry = {
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
};

export abstract class AuditWriter {
  abstract record(entry: AuditEntry): Promise<void>;
}

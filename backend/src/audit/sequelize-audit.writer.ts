import { Injectable } from '@nestjs/common';
import { AuditLog } from '../database/models.js';
import { AuditWriter, type AuditEntry } from './audit-entry.js';

@Injectable()
export class SequelizeAuditWriter extends AuditWriter {
  async record(entry: AuditEntry) {
    await AuditLog.create({
      userId: entry.userId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      oldValues: entry.oldValues,
      newValues: entry.newValues,
      ip: entry.ip,
      userAgent: entry.userAgent,
    });
  }
}

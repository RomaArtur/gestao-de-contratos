import { Global, Module } from '@nestjs/common';
import { AuditWriter } from './audit-entry.js';
import { SequelizeAuditWriter } from './sequelize-audit.writer.js';

@Global()
@Module({
  providers: [{ provide: AuditWriter, useClass: SequelizeAuditWriter }],
  exports: [AuditWriter],
})
export class AuditModule {}

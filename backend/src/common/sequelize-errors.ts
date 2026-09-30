import { ConflictException } from '@nestjs/common';
import { ForeignKeyConstraintError, UniqueConstraintError } from 'sequelize';

export function rethrowConstraint(error: unknown, uniqueMessage: string, foreignMessage?: string): never {
  if (error instanceof UniqueConstraintError) {
    throw new ConflictException(uniqueMessage);
  }
  if (foreignMessage && error instanceof ForeignKeyConstraintError) {
    throw new ConflictException(foreignMessage);
  }
  throw error;
}

import {
  DataTypes,
  Model,
  type Sequelize,
} from 'sequelize';
import { initEntidadesCatalogo } from './entidades-catalogo.js';
import { associarCorretorContrato, initEntidadesContrato } from './entidades-contrato.js';
import { associarCorretor, initEntidadesProposta } from './entidades-proposta.js';

export const ROLE_CODES = [
  'ADMIN',
  'GESTOR',
  'CORRETOR',
  'PROPRIETARIO',
  'CLIENTE',
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export class Role extends Model {
  declare id: string;
  declare code: RoleCode;
  declare name: string;
}

export class User extends Model {
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: string;
  declare active: boolean;
  declare role?: Role;
}

export class RefreshToken extends Model {
  declare id: string;
  declare userId: string;
  declare jti: string;
  declare expiresAt: Date;
  declare revokedAt: Date | null;
}

export class AuditLog extends Model {
  declare id: string;
  declare userId: string | null;
  declare action: string;
  declare entity: string;
  declare entityId: string | null;
  declare oldValues: Record<string, unknown> | null;
  declare newValues: Record<string, unknown> | null;
  declare ip: string | null;
  declare userAgent: string | null;
}

let initialized = false;

export function initModels(sequelize: Sequelize) {
  if (initialized) {
    return;
  }

  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
    },
    { sequelize, tableName: 'roles', underscored: true },
  );

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING(160), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      roleId: { type: DataTypes.UUID, allowNull: false },
      active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    },
    { sequelize, tableName: 'users', underscored: true },
  );

  RefreshToken.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: false },
      jti: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expiresAt: { type: DataTypes.DATE, allowNull: false },
      revokedAt: { type: DataTypes.DATE, allowNull: true },
    },
    {
      sequelize,
      tableName: 'refresh_tokens',
      underscored: true,
      updatedAt: false,
    },
  );

  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      userId: { type: DataTypes.UUID, allowNull: true },
      action: { type: DataTypes.STRING(64), allowNull: false },
      entity: { type: DataTypes.STRING(64), allowNull: false },
      entityId: { type: DataTypes.STRING(64), allowNull: true },
      oldValues: { type: DataTypes.JSONB, allowNull: true },
      newValues: { type: DataTypes.JSONB, allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      userAgent: { type: DataTypes.TEXT, allowNull: true },
    },
    {
      sequelize,
      tableName: 'audit_logs',
      underscored: true,
      updatedAt: false,
    },
  );

  const rejectMutation = () => {
    throw new Error('Registros de auditoria são imutáveis.');
  };
  AuditLog.addHook('beforeUpdate', rejectMutation);
  AuditLog.addHook('beforeDestroy', rejectMutation);
  AuditLog.addHook('beforeBulkUpdate', rejectMutation);
  AuditLog.addHook('beforeBulkDestroy', rejectMutation);

  Role.hasMany(User, { foreignKey: 'roleId' });
  User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
  User.hasMany(RefreshToken, { foreignKey: 'userId' });
  RefreshToken.belongsTo(User, { foreignKey: 'userId' });
  AuditLog.belongsTo(User, { foreignKey: 'userId' });
  initEntidadesCatalogo(sequelize);
  initEntidadesProposta(sequelize);
  initEntidadesContrato(sequelize);
  associarCorretor(User);
  associarCorretorContrato(User);

  initialized = true;
}

import { DataTypes, type QueryInterface, type Transaction } from 'sequelize';

export const ROLE_IDS = {
  ADMIN: '11111111-1111-4111-8111-111111111111',
  GESTOR: '22222222-2222-4222-8222-222222222222',
  CORRETOR: '33333333-3333-4333-8333-333333333333',
  PROPRIETARIO: '44444444-4444-4444-8444-444444444444',
  CLIENTE: '55555555-5555-4555-8555-555555555555',
} as const;

const roles = [
  { id: ROLE_IDS.ADMIN, code: 'ADMIN', name: 'Administrador' },
  { id: ROLE_IDS.GESTOR, code: 'GESTOR', name: 'Gestor' },
  { id: ROLE_IDS.CORRETOR, code: 'CORRETOR', name: 'Corretor' },
  { id: ROLE_IDS.PROPRIETARIO, code: 'PROPRIETARIO', name: 'Proprietário' },
  { id: ROLE_IDS.CLIENTE, code: 'CLIENTE', name: 'Cliente' },
];

export async function up(
  queryInterface: QueryInterface,
  transaction: Transaction,
) {
  const now = new Date();

  await queryInterface.createTable(
    'roles',
    {
      id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.bulkInsert(
    'roles',
    roles.map((role) => ({ ...role, created_at: now, updated_at: now })),
    { transaction },
  );

  await queryInterface.createTable(
    'users',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: { type: DataTypes.STRING(160), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.createTable(
    'refresh_tokens',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      jti: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.createTable(
    'audit_logs',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      action: { type: DataTypes.STRING(64), allowNull: false },
      entity: { type: DataTypes.STRING(64), allowNull: false },
      entity_id: { type: DataTypes.STRING(64), allowNull: true },
      old_values: { type: DataTypes.JSONB, allowNull: true },
      new_values: { type: DataTypes.JSONB, allowNull: true },
      ip: { type: DataTypes.STRING(64), allowNull: true },
      user_agent: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.addIndex('audit_logs', ['user_id'], {
    name: 'audit_logs_user_id',
    transaction,
  });
  await queryInterface.addIndex('audit_logs', ['created_at'], {
    name: 'audit_logs_created_at',
    transaction,
  });
}

export async function down(
  queryInterface: QueryInterface,
  transaction: Transaction,
) {
  await queryInterface.dropTable('audit_logs', { transaction });
  await queryInterface.dropTable('refresh_tokens', { transaction });
  await queryInterface.dropTable('users', { transaction });
  await queryInterface.dropTable('roles', { transaction });
}

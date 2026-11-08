import { DataTypes, type QueryInterface, type Transaction } from 'sequelize';
import { htmlModelo } from '../contratos/modelos-texto.js';

function colunaId() {
  return {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  };
}

const FORMAS = [
  ['a1111111-1111-4111-8111-111111111111', 'À vista', 'b1111111-1111-4111-8111-111111111111'],
  ['a2222222-2222-4222-8222-222222222222', 'PIX', 'b2222222-2222-4222-8222-222222222222'],
  ['a3333333-3333-4333-8333-333333333333', 'Boleto', 'b3333333-3333-4333-8333-333333333333'],
  ['a4444444-4444-4444-8444-444444444444', 'Transferência', 'b4444444-4444-4444-8444-444444444444'],
  ['a5555555-5555-4555-8555-555555555555', 'Financiamento', 'b5555555-5555-4555-8555-555555555555'],
  ['a6666666-6666-4666-8666-666666666666', 'Cartão', 'b6666666-6666-4666-8666-666666666666'],
] as const;

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  await queryInterface.addColumn(
    'propostas',
    'entrada',
    { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    { transaction },
  );
  await queryInterface.addColumn(
    'propostas',
    'parcelas',
    { type: DataTypes.INTEGER, allowNull: true },
    { transaction },
  );

  await queryInterface.createTable(
    'modelos_contrato',
    {
      id: colunaId(),
      forma_pagamento_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'formas_pagamento', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      conteudo: { type: DataTypes.TEXT, allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  const agora = new Date();
  await queryInterface.bulkInsert(
    'modelos_contrato',
    FORMAS.map(([formaId, nome, id]) => ({
      id,
      forma_pagamento_id: formaId,
      conteudo: htmlModelo(nome),
      created_at: agora,
      updated_at: agora,
    })),
    { transaction },
  );

  await queryInterface.addColumn(
    'contratos',
    'conteudo',
    { type: DataTypes.TEXT, allowNull: true },
    { transaction },
  );
  await queryInterface.addColumn(
    'contratos',
    'modelo_id',
    {
      type: DataTypes.UUID,
      allowNull: true,
      references: { model: 'modelos_contrato', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    { transaction },
  );
  await queryInterface.addColumn(
    'contratos',
    'finalizado_em',
    { type: DataTypes.DATE, allowNull: true },
    { transaction },
  );

  await queryInterface.createTable(
    'reenvios_contrato',
    {
      id: colunaId(),
      contrato_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'contratos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      cliente_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      email: { type: DataTypes.STRING(180), allowNull: false },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
}

import { DataTypes, type QueryInterface, type Transaction } from 'sequelize';

function colunaId() {
  return {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  };
}

const FORMAS = [
  ['a1111111-1111-4111-8111-111111111111', 'À vista'],
  ['a2222222-2222-4222-8222-222222222222', 'PIX'],
  ['a3333333-3333-4333-8333-333333333333', 'Boleto'],
  ['a4444444-4444-4444-8444-444444444444', 'Transferência'],
  ['a5555555-5555-4555-8555-555555555555', 'Financiamento'],
  ['a6666666-6666-4666-8666-666666666666', 'Cartão'],
] as const;

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  const agora = new Date();

  await queryInterface.createTable(
    'formas_pagamento',
    {
      id: colunaId(),
      nome: { type: DataTypes.STRING(80), allowNull: false },
      ativo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.bulkInsert(
    'formas_pagamento',
    FORMAS.map(([id, nome]) => ({
      id,
      nome,
      ativo: true,
      created_at: agora,
      updated_at: agora,
    })),
    { transaction },
  );

  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX formas_pagamento_nome ON formas_pagamento (lower(nome))',
    { transaction },
  );

  const forma = {
    type: DataTypes.UUID,
    allowNull: true,
    references: { model: 'formas_pagamento', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
  };
  await queryInterface.addColumn('propostas', 'forma_pagamento_id', forma, { transaction });
  await queryInterface.addColumn('contratos', 'forma_pagamento_id', forma, { transaction });

  await queryInterface.sequelize.query(
    'ALTER TABLE contratos ALTER COLUMN proposta_id DROP NOT NULL',
    { transaction },
  );
  await queryInterface.sequelize.query('DROP INDEX IF EXISTS contratos_proposta_id', { transaction });
  await queryInterface.sequelize.query(
    'CREATE UNIQUE INDEX contratos_proposta_id ON contratos (proposta_id) WHERE proposta_id IS NOT NULL',
    { transaction },
  );

  await queryInterface.createTable(
    'eventos',
    {
      id: colunaId(),
      titulo: { type: DataTypes.STRING(160), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false },
      inicio: { type: DataTypes.DATE, allowNull: false },
      fim: { type: DataTypes.DATE, allowNull: false },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      imovel_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'imoveis', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cliente_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      contrato_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'contratos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.addIndex('eventos', ['inicio'], { name: 'eventos_inicio', transaction });
  await queryInterface.addIndex('eventos', ['situacao'], { name: 'eventos_situacao', transaction });
}

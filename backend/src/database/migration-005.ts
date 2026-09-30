import { DataTypes, type QueryInterface, type Transaction } from 'sequelize';

function colunaId() {
  return {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
  };
}

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  await queryInterface.createTable(
    'contratos',
    {
      id: colunaId(),
      codigo: { type: DataTypes.STRING(20), allowNull: false },
      proposta_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'propostas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      imovel_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'imoveis', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      cliente_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'clientes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      corretor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      finalidade: { type: DataTypes.STRING(20), allowNull: false },
      valor: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      data_inicio: { type: DataTypes.DATEONLY, allowNull: false },
      vencimento: { type: DataTypes.DATEONLY, allowNull: false },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      observacoes: { type: DataTypes.TEXT, allowNull: true },
      motivo: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.addIndex('contratos', ['codigo'], {
    name: 'contratos_codigo',
    unique: true,
    transaction,
  });
  await queryInterface.addIndex('contratos', ['proposta_id'], {
    name: 'contratos_proposta_id',
    unique: true,
    transaction,
  });
  await queryInterface.addIndex('contratos', ['imovel_id'], {
    name: 'contratos_imovel_id',
    transaction,
  });
  await queryInterface.addIndex('contratos', ['cliente_id'], {
    name: 'contratos_cliente_id',
    transaction,
  });
  await queryInterface.addIndex('contratos', ['situacao'], {
    name: 'contratos_situacao',
    transaction,
  });

  await queryInterface.createTable(
    'documentos_contrato',
    {
      id: colunaId(),
      contrato_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'contratos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      categoria: { type: DataTypes.STRING(20), allowNull: false },
      chave_arquivo: { type: DataTypes.STRING(80), allowNull: false },
      nome_original: { type: DataTypes.STRING(180), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.createTable(
    'historicos_contrato',
    {
      id: colunaId(),
      contrato_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'contratos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      situacao_anterior: { type: DataTypes.STRING(20), allowNull: true },
      situacao_nova: { type: DataTypes.STRING(20), allowNull: false },
      observacao: { type: DataTypes.TEXT, allowNull: true },
      usuario_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );
}

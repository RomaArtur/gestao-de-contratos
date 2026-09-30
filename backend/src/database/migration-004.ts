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
    'propostas',
    {
      id: colunaId(),
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
      condicoes: { type: DataTypes.TEXT, allowNull: true },
      validade: { type: DataTypes.DATEONLY, allowNull: true },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      motivo: { type: DataTypes.TEXT, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false },
      updated_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.addIndex('propostas', ['imovel_id'], {
    name: 'propostas_imovel_id',
    transaction,
  });
  await queryInterface.addIndex('propostas', ['cliente_id'], {
    name: 'propostas_cliente_id',
    transaction,
  });
  await queryInterface.addIndex('propostas', ['situacao'], {
    name: 'propostas_situacao',
    transaction,
  });

  await queryInterface.createTable(
    'historicos_proposta',
    {
      id: colunaId(),
      proposta_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'propostas', key: 'id' },
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

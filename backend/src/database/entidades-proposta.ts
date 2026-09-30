import { DataTypes, Model, type ModelStatic, type Sequelize } from 'sequelize';
import { Cliente, Imovel } from './entidades-catalogo.js';

export const SITUACOES_PROPOSTA = [
  'RASCUNHO',
  'ENVIADA',
  'ACEITA',
  'RECUSADA',
  'CANCELADA',
] as const;

export const FINALIDADES_PROPOSTA = ['VENDA', 'ALUGUEL'] as const;

export class Proposta extends Model {
  declare id: string;
  declare imovelId: string;
  declare clienteId: string;
  declare corretorId: string;
  declare finalidade: (typeof FINALIDADES_PROPOSTA)[number];
  declare valor: string;
  declare condicoes: string | null;
  declare validade: string | null;
  declare situacao: (typeof SITUACOES_PROPOSTA)[number];
  declare motivo: string | null;
  declare createdAt: Date;
  declare imovel?: Imovel;
  declare cliente?: Cliente;
  declare corretor?: { id: string; name: string };
  declare historico?: HistoricoProposta[];
}

export class HistoricoProposta extends Model {
  declare id: string;
  declare propostaId: string;
  declare situacaoAnterior: string | null;
  declare situacaoNova: string;
  declare observacao: string | null;
  declare usuarioId: string | null;
  declare createdAt: Date;
  declare usuario?: { id: string; name: string };
}

function colunaId() {
  return { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };
}

export function initEntidadesProposta(sequelize: Sequelize) {
  Proposta.init(
    {
      id: colunaId(),
      imovelId: { type: DataTypes.UUID, allowNull: false },
      clienteId: { type: DataTypes.UUID, allowNull: false },
      corretorId: { type: DataTypes.UUID, allowNull: false },
      finalidade: { type: DataTypes.STRING(20), allowNull: false },
      valor: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      condicoes: { type: DataTypes.TEXT, allowNull: true },
      validade: { type: DataTypes.DATEONLY, allowNull: true },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      motivo: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'propostas', underscored: true },
  );

  HistoricoProposta.init(
    {
      id: colunaId(),
      propostaId: { type: DataTypes.UUID, allowNull: false },
      situacaoAnterior: { type: DataTypes.STRING(20), allowNull: true },
      situacaoNova: { type: DataTypes.STRING(20), allowNull: false },
      observacao: { type: DataTypes.TEXT, allowNull: true },
      usuarioId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'historicos_proposta', underscored: true, updatedAt: false },
  );

  Imovel.hasMany(Proposta, { foreignKey: 'imovelId' });
  Proposta.belongsTo(Imovel, { foreignKey: 'imovelId', as: 'imovel' });
  Cliente.hasMany(Proposta, { foreignKey: 'clienteId' });
  Proposta.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  Proposta.hasMany(HistoricoProposta, { foreignKey: 'propostaId', as: 'historico' });
  HistoricoProposta.belongsTo(Proposta, { foreignKey: 'propostaId' });
}

export function associarCorretor(Usuario: ModelStatic<Model>) {
  Proposta.belongsTo(Usuario, { foreignKey: 'corretorId', as: 'corretor' });
  HistoricoProposta.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
}

export interface Proposta {
  historico?: HistoricoProposta[];
}

import { DataTypes, Model, type Sequelize } from 'sequelize';
import { Cliente, Imovel } from './entidades-catalogo.js';
import { Contrato } from './entidades-contrato.js';

export const TIPOS_EVENTO = ['VISITA', 'REUNIAO', 'ASSINATURA', 'VENCIMENTO', 'COMPROMISSO'] as const;
export const SITUACOES_EVENTO = ['AGENDADO', 'CANCELADO'] as const;

export class Evento extends Model {
  declare id: string;
  declare titulo: string;
  declare tipo: (typeof TIPOS_EVENTO)[number];
  declare inicio: Date;
  declare fim: Date;
  declare descricao: string | null;
  declare situacao: (typeof SITUACOES_EVENTO)[number];
  declare imovelId: string | null;
  declare clienteId: string | null;
  declare contratoId: string | null;
  declare usuarioId: string;
  declare imovel?: Imovel;
  declare cliente?: Cliente;
  declare contrato?: Contrato;
}

function colunaId() {
  return { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };
}

export function initEntidadesAgenda(sequelize: Sequelize) {
  Evento.init(
    {
      id: colunaId(),
      titulo: { type: DataTypes.STRING(160), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false },
      inicio: { type: DataTypes.DATE, allowNull: false },
      fim: { type: DataTypes.DATE, allowNull: false },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      imovelId: { type: DataTypes.UUID, allowNull: true },
      clienteId: { type: DataTypes.UUID, allowNull: true },
      contratoId: { type: DataTypes.UUID, allowNull: true },
      usuarioId: { type: DataTypes.UUID, allowNull: false },
    },
    { sequelize, tableName: 'eventos', underscored: true },
  );

  Evento.belongsTo(Imovel, { foreignKey: 'imovelId', as: 'imovel' });
  Evento.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  Evento.belongsTo(Contrato, { foreignKey: 'contratoId', as: 'contrato' });
}

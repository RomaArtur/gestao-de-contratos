import { DataTypes, Model, type ModelStatic, type Sequelize } from 'sequelize';
import { Cliente, FormaPagamento, Imovel } from './entidades-catalogo.js';
import { Proposta } from './entidades-proposta.js';

export const SITUACOES_CONTRATO = ['MINUTA', 'VIGENTE', 'ENCERRADO', 'CANCELADO'] as const;
export const CATEGORIAS_DOCUMENTO_CONTRATO = ['MINUTA', 'ASSINADO', 'COMPROVANTE', 'OUTROS'] as const;

export class Contrato extends Model {
  declare id: string;
  declare codigo: string;
  declare propostaId: string | null;
  declare formaPagamentoId: string | null;
  declare imovelId: string;
  declare clienteId: string;
  declare corretorId: string;
  declare finalidade: 'VENDA' | 'ALUGUEL';
  declare valor: string;
  declare dataInicio: string;
  declare vencimento: string;
  declare situacao: (typeof SITUACOES_CONTRATO)[number];
  declare observacoes: string | null;
  declare motivo: string | null;
  declare conteudo: string | null;
  declare modeloId: string | null;
  declare finalizadoEm: Date | null;
  declare createdAt: Date;
  declare imovel?: Imovel;
  declare cliente?: Cliente;
  declare proposta?: Proposta;
  declare formaPagamento?: FormaPagamento;
  declare corretor?: { id: string; name: string };
  declare documentos?: DocumentoContrato[];
  declare historico?: HistoricoContrato[];
}

export class DocumentoContrato extends Model {
  declare id: string;
  declare contratoId: string;
  declare categoria: (typeof CATEGORIAS_DOCUMENTO_CONTRATO)[number];
  declare chaveArquivo: string;
  declare nomeOriginal: string;
  declare createdAt: Date;
}

export class ModeloContrato extends Model {
  declare id: string;
  declare formaPagamentoId: string;
  declare conteudo: string;
}

export class ReenvioContrato extends Model {
  declare id: string;
  declare contratoId: string;
  declare clienteId: string;
  declare email: string;
  declare usuarioId: string;
  declare createdAt: Date;
}

export class HistoricoContrato extends Model {
  declare id: string;
  declare contratoId: string;
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

export function initEntidadesContrato(sequelize: Sequelize) {
  Contrato.init(
    {
      id: colunaId(),
      codigo: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      propostaId: { type: DataTypes.UUID, allowNull: true },
      formaPagamentoId: { type: DataTypes.UUID, allowNull: true },
      imovelId: { type: DataTypes.UUID, allowNull: false },
      clienteId: { type: DataTypes.UUID, allowNull: false },
      corretorId: { type: DataTypes.UUID, allowNull: false },
      finalidade: { type: DataTypes.STRING(20), allowNull: false },
      valor: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      dataInicio: { type: DataTypes.DATEONLY, allowNull: false },
      vencimento: { type: DataTypes.DATEONLY, allowNull: false },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      observacoes: { type: DataTypes.TEXT, allowNull: true },
      motivo: { type: DataTypes.TEXT, allowNull: true },
      conteudo: { type: DataTypes.TEXT, allowNull: true },
      modeloId: { type: DataTypes.UUID, allowNull: true },
      finalizadoEm: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, tableName: 'contratos', underscored: true },
  );

  DocumentoContrato.init(
    {
      id: colunaId(),
      contratoId: { type: DataTypes.UUID, allowNull: false },
      categoria: { type: DataTypes.STRING(20), allowNull: false },
      chaveArquivo: { type: DataTypes.STRING(80), allowNull: false },
      nomeOriginal: { type: DataTypes.STRING(180), allowNull: false },
    },
    { sequelize, tableName: 'documentos_contrato', underscored: true, updatedAt: false },
  );

  ModeloContrato.init(
    {
      id: colunaId(),
      formaPagamentoId: { type: DataTypes.UUID, allowNull: false, unique: true },
      conteudo: { type: DataTypes.TEXT, allowNull: false },
    },
    { sequelize, tableName: 'modelos_contrato', underscored: true },
  );

  ReenvioContrato.init(
    {
      id: colunaId(),
      contratoId: { type: DataTypes.UUID, allowNull: false },
      clienteId: { type: DataTypes.UUID, allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false },
      usuarioId: { type: DataTypes.UUID, allowNull: false },
    },
    { sequelize, tableName: 'reenvios_contrato', underscored: true, updatedAt: false },
  );

  HistoricoContrato.init(
    {
      id: colunaId(),
      contratoId: { type: DataTypes.UUID, allowNull: false },
      situacaoAnterior: { type: DataTypes.STRING(20), allowNull: true },
      situacaoNova: { type: DataTypes.STRING(20), allowNull: false },
      observacao: { type: DataTypes.TEXT, allowNull: true },
      usuarioId: { type: DataTypes.UUID, allowNull: true },
    },
    { sequelize, tableName: 'historicos_contrato', underscored: true, updatedAt: false },
  );

  Proposta.hasOne(Contrato, { foreignKey: 'propostaId', as: 'contrato' });
  Contrato.belongsTo(Proposta, { foreignKey: 'propostaId', as: 'proposta' });
  Contrato.belongsTo(FormaPagamento, { foreignKey: 'formaPagamentoId', as: 'formaPagamento' });
  FormaPagamento.hasOne(ModeloContrato, { foreignKey: 'formaPagamentoId', as: 'modelo' });
  ModeloContrato.belongsTo(FormaPagamento, { foreignKey: 'formaPagamentoId', as: 'formaPagamento' });
  Contrato.hasMany(ReenvioContrato, { foreignKey: 'contratoId', as: 'reenvios' });
  ReenvioContrato.belongsTo(Contrato, { foreignKey: 'contratoId' });
  Imovel.hasMany(Contrato, { foreignKey: 'imovelId' });
  Contrato.belongsTo(Imovel, { foreignKey: 'imovelId', as: 'imovel' });
  Cliente.hasMany(Contrato, { foreignKey: 'clienteId' });
  Contrato.belongsTo(Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  Contrato.hasMany(DocumentoContrato, { foreignKey: 'contratoId', as: 'documentos' });
  DocumentoContrato.belongsTo(Contrato, { foreignKey: 'contratoId' });
  Contrato.hasMany(HistoricoContrato, { foreignKey: 'contratoId', as: 'historico' });
  HistoricoContrato.belongsTo(Contrato, { foreignKey: 'contratoId' });
}

export function associarCorretorContrato(Usuario: ModelStatic<Model>) {
  Contrato.belongsTo(Usuario, { foreignKey: 'corretorId', as: 'corretor' });
  HistoricoContrato.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
}

import { DataTypes, Model, type Sequelize } from 'sequelize';

export const TIPOS_IMOVEL = [
  'CASA',
  'APARTAMENTO',
  'SALA_COMERCIAL',
  'LOJA',
  'GALPAO',
  'TERRENO',
  'CHACARA',
  'OUTROS',
] as const;

export const FINALIDADES_IMOVEL = ['VENDA', 'ALUGUEL', 'VENDA_ALUGUEL'] as const;
export const SITUACOES_IMOVEL = [
  'DISPONIVEL',
  'EM_NEGOCIACAO',
  'RESERVADO',
  'ALUGADO',
  'VENDIDO',
  'INATIVO',
] as const;

export const CATEGORIAS_DOCUMENTO = [
  'MATRICULA',
  'IPTU',
  'PLANTA',
  'ESCRITURA',
  'CERTIDAO',
  'OUTROS',
] as const;

export const TIPOS_CLIENTE = [
  'COMPRADOR',
  'LOCATARIO',
  'INVESTIDOR',
  'EMPRESA',
  'OUTROS',
] as const;

export class Proprietario extends Model {
  declare id: string;
  declare tipoPessoa: 'FISICA' | 'JURIDICA';
  declare nome: string;
  declare nomeFantasia: string | null;
  declare documentoCifrado: string;
  declare documentoBusca: string;
  declare dataNascimento: string | null;
  declare telefone: string;
  declare email: string;
  declare nomeResponsavel: string | null;
  declare cep: string;
  declare logradouro: string;
  declare numero: string;
  declare complemento: string | null;
  declare bairro: string;
  declare cidade: string;
  declare uf: string;
}

export class Imovel extends Model {
  declare id: string;
  declare codigo: string;
  declare proprietarioId: string;
  declare tipo: (typeof TIPOS_IMOVEL)[number];
  declare finalidade: (typeof FINALIDADES_IMOVEL)[number];
  declare situacao: (typeof SITUACOES_IMOVEL)[number];
  declare cep: string;
  declare logradouro: string;
  declare numero: string;
  declare complemento: string | null;
  declare bairro: string;
  declare cidade: string;
  declare uf: string;
  declare area: string;
  declare quartos: number;
  declare banheiros: number;
  declare vagas: number;
  declare descricao: string | null;
  declare valorVenda: string | null;
  declare valorAluguel: string | null;
  declare valorCondominio: string | null;
  declare valorIptu: string | null;
  declare proprietario?: Proprietario;
}

export class FotoImovel extends Model {
  declare id: string;
  declare imovelId: string;
  declare chaveArquivo: string;
  declare nomeOriginal: string;
  declare ordem: number;
  declare principal: boolean;
}

export class DocumentoImovel extends Model {
  declare id: string;
  declare imovelId: string;
  declare categoria: (typeof CATEGORIAS_DOCUMENTO)[number];
  declare chaveArquivo: string;
  declare nomeOriginal: string;
  declare createdAt: Date;
}

export class Cliente extends Model {
  declare id: string;
  declare nome: string;
  declare documentoCifrado: string;
  declare documentoBusca: string;
  declare telefone: string;
  declare whatsapp: string | null;
  declare email: string;
  declare cep: string;
  declare logradouro: string;
  declare numero: string;
  declare complemento: string | null;
  declare bairro: string;
  declare cidade: string;
  declare uf: string;
  declare tipo: (typeof TIPOS_CLIENTE)[number];
  declare observacoes: string | null;
}

function colunaId() {
  return { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true };
}

export function initEntidadesCatalogo(sequelize: Sequelize) {
  Proprietario.init(
    {
      id: colunaId(),
      tipoPessoa: { type: DataTypes.STRING(16), allowNull: false },
      nome: { type: DataTypes.STRING(160), allowNull: false },
      nomeFantasia: { type: DataTypes.STRING(160), allowNull: true },
      documentoCifrado: { type: DataTypes.TEXT, allowNull: false },
      documentoBusca: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      dataNascimento: { type: DataTypes.DATEONLY, allowNull: true },
      telefone: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false },
      nomeResponsavel: { type: DataTypes.STRING(160), allowNull: true },
      cep: { type: DataTypes.STRING(8), allowNull: false },
      logradouro: { type: DataTypes.STRING(160), allowNull: false },
      numero: { type: DataTypes.STRING(20), allowNull: false },
      complemento: { type: DataTypes.STRING(80), allowNull: true },
      bairro: { type: DataTypes.STRING(80), allowNull: false },
      cidade: { type: DataTypes.STRING(80), allowNull: false },
      uf: { type: DataTypes.STRING(2), allowNull: false },
    },
    { sequelize, tableName: 'proprietarios', underscored: true },
  );

  Imovel.init(
    {
      id: colunaId(),
      codigo: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      proprietarioId: { type: DataTypes.UUID, allowNull: false },
      tipo: { type: DataTypes.STRING(32), allowNull: false },
      finalidade: { type: DataTypes.STRING(20), allowNull: false },
      situacao: { type: DataTypes.STRING(20), allowNull: false },
      cep: { type: DataTypes.STRING(8), allowNull: false },
      logradouro: { type: DataTypes.STRING(160), allowNull: false },
      numero: { type: DataTypes.STRING(20), allowNull: false },
      complemento: { type: DataTypes.STRING(80), allowNull: true },
      bairro: { type: DataTypes.STRING(80), allowNull: false },
      cidade: { type: DataTypes.STRING(80), allowNull: false },
      uf: { type: DataTypes.STRING(2), allowNull: false },
      area: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      quartos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      banheiros: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      vagas: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      descricao: { type: DataTypes.TEXT, allowNull: true },
      valorVenda: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      valorAluguel: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      valorCondominio: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      valorIptu: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
    },
    { sequelize, tableName: 'imoveis', underscored: true },
  );

  FotoImovel.init(
    {
      id: colunaId(),
      imovelId: { type: DataTypes.UUID, allowNull: false },
      chaveArquivo: { type: DataTypes.STRING(80), allowNull: false },
      nomeOriginal: { type: DataTypes.STRING(180), allowNull: false },
      ordem: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      principal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { sequelize, tableName: 'fotos_imovel', underscored: true, updatedAt: false },
  );

  DocumentoImovel.init(
    {
      id: colunaId(),
      imovelId: { type: DataTypes.UUID, allowNull: false },
      categoria: { type: DataTypes.STRING(20), allowNull: false },
      chaveArquivo: { type: DataTypes.STRING(80), allowNull: false },
      nomeOriginal: { type: DataTypes.STRING(180), allowNull: false },
    },
    { sequelize, tableName: 'documentos_imovel', underscored: true, updatedAt: false },
  );

  Cliente.init(
    {
      id: colunaId(),
      nome: { type: DataTypes.STRING(160), allowNull: false },
      documentoCifrado: { type: DataTypes.TEXT, allowNull: false },
      documentoBusca: { type: DataTypes.STRING(64), allowNull: false, unique: true },
      telefone: { type: DataTypes.STRING(20), allowNull: false },
      whatsapp: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(180), allowNull: false },
      cep: { type: DataTypes.STRING(8), allowNull: false },
      logradouro: { type: DataTypes.STRING(160), allowNull: false },
      numero: { type: DataTypes.STRING(20), allowNull: false },
      complemento: { type: DataTypes.STRING(80), allowNull: true },
      bairro: { type: DataTypes.STRING(80), allowNull: false },
      cidade: { type: DataTypes.STRING(80), allowNull: false },
      uf: { type: DataTypes.STRING(2), allowNull: false },
      tipo: { type: DataTypes.STRING(20), allowNull: false },
      observacoes: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, tableName: 'clientes', underscored: true },
  );

  Proprietario.hasMany(Imovel, { foreignKey: 'proprietarioId' });
  Imovel.belongsTo(Proprietario, { foreignKey: 'proprietarioId', as: 'proprietario' });
  Imovel.hasMany(FotoImovel, { foreignKey: 'imovelId', as: 'fotos' });
  FotoImovel.belongsTo(Imovel, { foreignKey: 'imovelId' });
  Imovel.hasMany(DocumentoImovel, { foreignKey: 'imovelId', as: 'documentos' });
  DocumentoImovel.belongsTo(Imovel, { foreignKey: 'imovelId' });
}

export interface Imovel {
  fotos?: FotoImovel[];
  documentos?: DocumentoImovel[];
}

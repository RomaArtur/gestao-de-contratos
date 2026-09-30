import type { QueryInterface, Transaction } from 'sequelize';

const COLUNAS_ENDERECO: [string, string][] = [
  ['zip_code', 'cep'],
  ['street', 'logradouro'],
  ['number', 'numero'],
  ['complement', 'complemento'],
  ['neighborhood', 'bairro'],
  ['city', 'cidade'],
  ['state', 'uf'],
];

async function renomearColunas(
  queryInterface: QueryInterface,
  tabela: string,
  colunas: [string, string][],
  transaction: Transaction,
) {
  for (const [atual, novo] of colunas) {
    await queryInterface.renameColumn(tabela, atual, novo, { transaction });
  }
}

export async function up(queryInterface: QueryInterface, transaction: Transaction) {
  await queryInterface.renameTable('owners', 'proprietarios', { transaction });
  await queryInterface.renameTable('properties', 'imoveis', { transaction });
  await queryInterface.renameTable('property_photos', 'fotos_imovel', { transaction });
  await queryInterface.renameTable('property_documents', 'documentos_imovel', { transaction });
  await queryInterface.renameTable('clients', 'clientes', { transaction });

  await renomearColunas(
    queryInterface,
    'proprietarios',
    [
      ['person_type', 'tipo_pessoa'],
      ['name', 'nome'],
      ['trade_name', 'nome_fantasia'],
      ['document_cipher', 'documento_cifrado'],
      ['document_lookup', 'documento_busca'],
      ['birth_date', 'data_nascimento'],
      ['phone', 'telefone'],
      ['responsible_name', 'nome_responsavel'],
      ...COLUNAS_ENDERECO,
    ],
    transaction,
  );

  await renomearColunas(
    queryInterface,
    'imoveis',
    [
      ['code', 'codigo'],
      ['owner_id', 'proprietario_id'],
      ['type', 'tipo'],
      ['purpose', 'finalidade'],
      ['status', 'situacao'],
      ...COLUNAS_ENDERECO,
      ['bedrooms', 'quartos'],
      ['bathrooms', 'banheiros'],
      ['parking_spots', 'vagas'],
      ['description', 'descricao'],
      ['sale_price', 'valor_venda'],
      ['rent_price', 'valor_aluguel'],
      ['condo_fee', 'valor_condominio'],
      ['property_tax', 'valor_iptu'],
    ],
    transaction,
  );

  await renomearColunas(
    queryInterface,
    'fotos_imovel',
    [
      ['property_id', 'imovel_id'],
      ['storage_key', 'chave_arquivo'],
      ['original_name', 'nome_original'],
      ['sort_order', 'ordem'],
      ['is_primary', 'principal'],
    ],
    transaction,
  );

  await renomearColunas(
    queryInterface,
    'documentos_imovel',
    [
      ['property_id', 'imovel_id'],
      ['category', 'categoria'],
      ['storage_key', 'chave_arquivo'],
      ['original_name', 'nome_original'],
    ],
    transaction,
  );

  await renomearColunas(
    queryInterface,
    'clientes',
    [
      ['name', 'nome'],
      ['document_cipher', 'documento_cifrado'],
      ['document_lookup', 'documento_busca'],
      ['phone', 'telefone'],
      ...COLUNAS_ENDERECO,
      ['type', 'tipo'],
      ['notes', 'observacoes'],
    ],
    transaction,
  );

  await queryInterface.sequelize.query(
    `
      ALTER INDEX IF EXISTS properties_owner_id RENAME TO imoveis_proprietario_id;
      ALTER INDEX IF EXISTS properties_status RENAME TO imoveis_situacao;
      ALTER INDEX IF EXISTS properties_city RENAME TO imoveis_cidade;
    `,
    { transaction },
  );
}

import { DataTypes, type QueryInterface, type Transaction } from 'sequelize';

const id = {
  type: DataTypes.UUID,
  primaryKey: true,
  allowNull: false,
  defaultValue: DataTypes.UUIDV4,
};
const timestamps = {
  created_at: { type: DataTypes.DATE, allowNull: false },
  updated_at: { type: DataTypes.DATE, allowNull: false },
};

function addressColumns() {
  return {
    zip_code: { type: DataTypes.STRING(8), allowNull: false },
    street: { type: DataTypes.STRING(160), allowNull: false },
    number: { type: DataTypes.STRING(20), allowNull: false },
    complement: { type: DataTypes.STRING(80), allowNull: true },
    neighborhood: { type: DataTypes.STRING(80), allowNull: false },
    city: { type: DataTypes.STRING(80), allowNull: false },
    state: { type: DataTypes.STRING(2), allowNull: false },
  };
}

export async function up(
  queryInterface: QueryInterface,
  transaction: Transaction,
) {
  await queryInterface.createTable(
    'owners',
    {
      id,
      person_type: { type: DataTypes.STRING(16), allowNull: false },
      name: { type: DataTypes.STRING(160), allowNull: false },
      trade_name: { type: DataTypes.STRING(160), allowNull: true },
      document_cipher: { type: DataTypes.TEXT, allowNull: false },
      document_lookup: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      birth_date: { type: DataTypes.DATEONLY, allowNull: true },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      email: { type: DataTypes.STRING(180), allowNull: false },
      responsible_name: { type: DataTypes.STRING(160), allowNull: true },
      ...addressColumns(),
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.createTable(
    'properties',
    {
      id,
      code: { type: DataTypes.STRING(32), allowNull: false, unique: true },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'owners', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      type: { type: DataTypes.STRING(32), allowNull: false },
      purpose: { type: DataTypes.STRING(20), allowNull: false },
      status: { type: DataTypes.STRING(20), allowNull: false },
      ...addressColumns(),
      area: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      bedrooms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      bathrooms: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      parking_spots: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      description: { type: DataTypes.TEXT, allowNull: true },
      sale_price: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      rent_price: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      condo_fee: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      property_tax: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      ...timestamps,
    },
    { transaction },
  );

  await queryInterface.addIndex('properties', ['owner_id'], {
    name: 'properties_owner_id',
    transaction,
  });
  await queryInterface.addIndex('properties', ['status'], {
    name: 'properties_status',
    transaction,
  });
  await queryInterface.addIndex('properties', ['city'], {
    name: 'properties_city',
    transaction,
  });

  await queryInterface.createTable(
    'property_photos',
    {
      id,
      property_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      storage_key: { type: DataTypes.STRING(80), allowNull: false },
      original_name: { type: DataTypes.STRING(180), allowNull: false },
      sort_order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      is_primary: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.createTable(
    'property_documents',
    {
      id,
      property_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'properties', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      category: { type: DataTypes.STRING(20), allowNull: false },
      storage_key: { type: DataTypes.STRING(80), allowNull: false },
      original_name: { type: DataTypes.STRING(180), allowNull: false },
      created_at: { type: DataTypes.DATE, allowNull: false },
    },
    { transaction },
  );

  await queryInterface.createTable(
    'clients',
    {
      id,
      name: { type: DataTypes.STRING(160), allowNull: false },
      document_cipher: { type: DataTypes.TEXT, allowNull: false },
      document_lookup: {
        type: DataTypes.STRING(64),
        allowNull: false,
        unique: true,
      },
      phone: { type: DataTypes.STRING(20), allowNull: false },
      whatsapp: { type: DataTypes.STRING(20), allowNull: true },
      email: { type: DataTypes.STRING(180), allowNull: false },
      ...addressColumns(),
      type: { type: DataTypes.STRING(20), allowNull: false },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...timestamps,
    },
    { transaction },
  );
}

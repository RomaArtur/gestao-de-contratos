import { DataTypes, QueryTypes, type Sequelize } from 'sequelize';
import * as catalogMigration from './migration-002.js';
import * as dominioMigration from './migration-003.js';
import * as contratoMigration from './migration-005.js';
import * as propostaMigration from './migration-004.js';
import * as initMigration from './migrations.js';

const MIGRATIONS = [
  { name: '001-init', up: initMigration.up },
  { name: '002-catalog', up: catalogMigration.up },
  { name: '003-dominio-pt', up: dominioMigration.up },
  { name: '004-propostas', up: propostaMigration.up },
  { name: '005-contratos', up: contratoMigration.up },
];

function tableNames(tables: unknown[]): string[] {
  return tables.map((table) => {
    if (typeof table === 'string') {
      return table;
    }
    if (table && typeof table === 'object' && 'tableName' in table) {
      return String((table as { tableName: string }).tableName);
    }
    return String(table);
  });
}

export async function runMigrations(sequelize: Sequelize) {
  const queryInterface = sequelize.getQueryInterface();
  const existing = tableNames(await queryInterface.showAllTables());
  if (!existing.includes('SequelizeMeta')) {
    await queryInterface.createTable('SequelizeMeta', {
      name: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    });
  }

  const applied = (await sequelize.query(
    'SELECT name FROM "SequelizeMeta"',
    { type: QueryTypes.SELECT },
  )) as { name: string }[];
  const done = new Set(applied.map((row) => row.name));

  for (const migration of MIGRATIONS) {
    if (done.has(migration.name)) {
      continue;
    }
    await sequelize.transaction(async (transaction) => {
      await migration.up(queryInterface, transaction);
      await sequelize.query(
        'INSERT INTO "SequelizeMeta" (name) VALUES (:name)',
        { replacements: { name: migration.name }, transaction },
      );
    });
  }
}

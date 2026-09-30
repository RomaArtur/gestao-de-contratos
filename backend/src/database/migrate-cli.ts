import 'dotenv/config';
import { Sequelize } from 'sequelize';
import { initModels } from './models.js';
import { runMigrations } from './run-migrations.js';
import { seedAdmin } from './seed-admin.js';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL é obrigatório.');
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: false,
});
initModels(sequelize);
await runMigrations(sequelize);

if (process.argv.includes('--seed')) {
  await seedAdmin({
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    name: process.env.SEED_ADMIN_NAME,
  });
}

await sequelize.close();

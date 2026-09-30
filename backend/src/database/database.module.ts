import { Global, Inject, Module, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Sequelize } from 'sequelize';
import { initModels } from './models.js';
import { runMigrations } from './run-migrations.js';
import { seedAdmin } from './seed-admin.js';

export const SEQUELIZE = Symbol('SEQUELIZE');

@Global()
@Module({
  providers: [
    {
      provide: SEQUELIZE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const sequelize = new Sequelize(config.getOrThrow<string>('DATABASE_URL'), {
          dialect: 'postgres',
          logging: false,
        });
        initModels(sequelize);
        return sequelize;
      },
    },
  ],
  exports: [SEQUELIZE],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
    private readonly config: ConfigService,
  ) {}

  async onModuleInit() {
    await runMigrations(this.sequelize);
    await seedAdmin({
      email: this.config.get<string>('SEED_ADMIN_EMAIL'),
      password: this.config.get<string>('SEED_ADMIN_PASSWORD'),
      name: this.config.get<string>('SEED_ADMIN_NAME'),
    });
  }
}

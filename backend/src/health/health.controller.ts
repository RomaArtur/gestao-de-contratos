import { Controller, Get, Inject, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Sequelize } from 'sequelize';
import { SEQUELIZE } from '../database/database.module.js';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  @Get()
  async check() {
    try {
      await this.sequelize.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException('Banco indisponível.');
    }
    return { status: 'ok', database: 'up' };
  }
}

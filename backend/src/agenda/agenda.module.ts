import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { AgendaController } from './agenda.controller.js';
import { AgendaRepository } from './agenda.repository.js';
import { AgendaService } from './agenda.service.js';

@Module({
  imports: [AuthModule],
  controllers: [AgendaController],
  providers: [AgendaService, AgendaRepository],
})
export class AgendaModule {}

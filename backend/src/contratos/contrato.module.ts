import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { ContratoController } from './contrato.controller.js';
import { ContratoRepository } from './contrato.repository.js';
import { ContratoService } from './contrato.service.js';

@Module({
  controllers: [ContratoController],
  providers: [ContratoService, ContratoRepository, RolesGuard],
  exports: [ContratoRepository],
})
export class ContratoModule {}

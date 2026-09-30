import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { PropostaController } from './proposta.controller.js';
import { PropostaRepository } from './proposta.repository.js';
import { PropostaService } from './proposta.service.js';

@Module({
  controllers: [PropostaController],
  providers: [PropostaService, PropostaRepository, RolesGuard],
  exports: [PropostaRepository],
})
export class PropostaModule {}

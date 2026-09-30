import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { ContratoModule } from '../contratos/contrato.module.js';
import { PropostaModule } from '../propostas/proposta.module.js';
import { ClienteController } from './cliente.controller.js';
import { ClienteRepository } from './cliente.repository.js';
import { ClienteService } from './cliente.service.js';

@Module({
  imports: [PropostaModule, ContratoModule],
  controllers: [ClienteController],
  providers: [ClienteService, ClienteRepository, RolesGuard],
})
export class ClienteModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContratoModule } from '../contratos/contrato.module.js';
import { PropostaModule } from '../propostas/proposta.module.js';
import { ClienteController } from './cliente.controller.js';
import { ClienteRepository } from './cliente.repository.js';
import { ClienteService } from './cliente.service.js';

@Module({
  imports: [AuthModule, PropostaModule, ContratoModule],
  controllers: [ClienteController],
  providers: [ClienteService, ClienteRepository],
})
export class ClienteModule {}

import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ContratoModule } from '../contratos/contrato.module.js';
import { FormaPagamentoModule } from '../formas-pagamento/forma-pagamento.module.js';
import { ImovelModule } from '../imoveis/imovel.module.js';
import { PropostaController } from './proposta.controller.js';
import { PropostaRepository } from './proposta.repository.js';
import { PropostaService } from './proposta.service.js';

@Module({
  imports: [AuthModule, ImovelModule, FormaPagamentoModule, ContratoModule],
  controllers: [PropostaController],
  providers: [PropostaService, PropostaRepository],
  exports: [PropostaService],
})
export class PropostaModule {}

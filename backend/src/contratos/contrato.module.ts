import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { EmailModule } from '../email/email.module.js';
import { FormaPagamentoModule } from '../formas-pagamento/forma-pagamento.module.js';
import { ImovelModule } from '../imoveis/imovel.module.js';
import { ContratoController } from './contrato.controller.js';
import { ContratoRepository } from './contrato.repository.js';
import { ContratoService } from './contrato.service.js';

@Module({
  imports: [AuthModule, ImovelModule, FormaPagamentoModule, EmailModule],
  controllers: [ContratoController],
  providers: [ContratoService, ContratoRepository],
  exports: [ContratoService],
})
export class ContratoModule {}

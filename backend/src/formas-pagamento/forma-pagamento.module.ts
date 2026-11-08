import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { FormaPagamentoController } from './forma-pagamento.controller.js';
import { FormaPagamentoService } from './forma-pagamento.service.js';

@Module({
  imports: [AuthModule],
  controllers: [FormaPagamentoController],
  providers: [FormaPagamentoService],
  exports: [FormaPagamentoService],
})
export class FormaPagamentoModule {}

import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ArquivoAdapter } from './arquivo.adapter.js';
import { ArquivoController } from './arquivo.controller.js';

@Global()
@Module({
  imports: [AuthModule],
  controllers: [ArquivoController],
  providers: [ArquivoAdapter],
  exports: [ArquivoAdapter],
})
export class ArquivosModule {}

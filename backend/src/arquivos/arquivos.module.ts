import { Global, Module } from '@nestjs/common';
import { ArquivoAdapter } from './arquivo.adapter.js';
import { ArquivoController } from './arquivo.controller.js';

@Global()
@Module({
  controllers: [ArquivoController],
  providers: [ArquivoAdapter],
  exports: [ArquivoAdapter],
})
export class ArquivosModule {}

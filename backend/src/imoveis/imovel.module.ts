import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ImovelController } from './imovel.controller.js';
import { ImovelRepository } from './imovel.repository.js';
import { ImovelService } from './imovel.service.js';
import { SituacaoImovel } from './situacao-imovel.js';

@Module({
  imports: [AuthModule],
  controllers: [ImovelController],
  providers: [ImovelService, ImovelRepository, SituacaoImovel],
  exports: [SituacaoImovel],
})
export class ImovelModule {}

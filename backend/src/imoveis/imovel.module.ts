import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { ImovelController } from './imovel.controller.js';
import { ImovelRepository } from './imovel.repository.js';
import { ImovelService } from './imovel.service.js';

@Module({
  controllers: [ImovelController],
  providers: [ImovelService, ImovelRepository, RolesGuard],
})
export class ImovelModule {}

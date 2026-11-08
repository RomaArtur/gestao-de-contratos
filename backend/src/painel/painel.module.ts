import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { PainelController } from './painel.controller.js';
import { PainelService } from './painel.service.js';

@Module({
  imports: [AuthModule],
  controllers: [PainelController],
  providers: [PainelService],
})
export class PainelModule {}

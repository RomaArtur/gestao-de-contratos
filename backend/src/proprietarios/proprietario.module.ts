import { Module } from '@nestjs/common';
import { RolesGuard } from '../auth/roles.guard.js';
import { ProprietarioController } from './proprietario.controller.js';
import { ProprietarioRepository } from './proprietario.repository.js';
import { ProprietarioService } from './proprietario.service.js';

@Module({
  controllers: [ProprietarioController],
  providers: [ProprietarioService, ProprietarioRepository, RolesGuard],
  exports: [ProprietarioRepository],
})
export class ProprietarioModule {}

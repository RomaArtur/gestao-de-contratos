import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { ProprietarioController } from './proprietario.controller.js';
import { ProprietarioRepository } from './proprietario.repository.js';
import { ProprietarioService } from './proprietario.service.js';

@Module({
  imports: [AuthModule],
  controllers: [ProprietarioController],
  providers: [ProprietarioService, ProprietarioRepository],
  exports: [ProprietarioRepository],
})
export class ProprietarioModule {}

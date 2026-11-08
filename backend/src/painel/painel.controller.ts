import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { PainelService } from './painel.service.js';

@ApiTags('painel')
@ApiBearerAuth()
@Controller('painel')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class PainelController {
  constructor(private readonly painel: PainelService) {}

  @Get()
  resumo() {
    return this.painel.resumo();
  }
}

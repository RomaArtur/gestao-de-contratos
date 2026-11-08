import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { atorDe } from '../comum/ator.js';
import { entradaValidada } from '../comum/entrada.js';
import { AgendaService } from './agenda.service.js';
import { EventoDto, ListarAgendaDto, eventoSchema } from './agenda.schema.js';

@ApiTags('agenda')
@ApiBearerAuth()
@Controller('agenda')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}

  @Get()
  listar(@Query() consulta: ListarAgendaDto) {
    return this.agenda.listar(consulta.inicio, consulta.fim);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.agenda.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: EventoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.agenda.criar(entradaValidada(eventoSchema, body), atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: EventoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.agenda.atualizar(id, entradaValidada(eventoSchema, body), atorDe(usuario, request));
  }

  @Post(':id/cancelar')
  @Roles('ADMIN', 'CORRETOR')
  cancelar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.agenda.cancelar(id, atorDe(usuario, request));
  }
}

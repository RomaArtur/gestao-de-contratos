import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { atorDe } from '../comum/ator.js';
import {
  ListarProprietariosDto,
  ProprietarioDto,
  type DadosProprietario,
} from './proprietario.schema.js';
import { ProprietarioService } from './proprietario.service.js';

@ApiTags('proprietarios')
@ApiBearerAuth()
@Controller('proprietarios')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class ProprietarioController {
  constructor(private readonly proprietarios: ProprietarioService) {}

  @Get()
  listar(@Query() consulta: ListarProprietariosDto) {
    return this.proprietarios.listar(consulta);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.proprietarios.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: ProprietarioDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.proprietarios.criar(body as unknown as DadosProprietario, atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: ProprietarioDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.proprietarios.atualizar(
      id,
      body as unknown as DadosProprietario,
      atorDe(usuario, request),
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  excluir(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.proprietarios.excluir(id, atorDe(usuario, request));
  }
}

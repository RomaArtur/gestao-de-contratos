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
import { entradaValidada } from '../comum/entrada.js';
import { ContratoService } from '../contratos/contrato.service.js';
import { GerarContratoDto, gerarContratoSchema } from '../contratos/contrato.schema.js';
import { PropostaService } from './proposta.service.js';
import { ListarPropostasDto, MotivoDto, PropostaDto, propostaSchema } from './proposta.schema.js';

@ApiTags('propostas')
@ApiBearerAuth()
@Controller('propostas')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class PropostaController {
  constructor(
    private readonly propostas: PropostaService,
    private readonly contratos: ContratoService,
  ) {}

  @Get()
  listar(@Query() consulta: ListarPropostasDto) {
    return this.propostas.listar(consulta);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.propostas.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: PropostaDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.criar(entradaValidada(propostaSchema, body), atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: PropostaDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.atualizar(id, entradaValidada(propostaSchema, body), atorDe(usuario, request));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  excluir(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.excluir(id, atorDe(usuario, request));
  }

  @Post(':id/gerar-contrato')
  @Roles('ADMIN', 'CORRETOR')
  gerarContrato(
    @Param('id') id: string,
    @Body() body: GerarContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.gerarDaProposta(
      id,
      entradaValidada(gerarContratoSchema, body),
      atorDe(usuario, request),
    );
  }

  @Post(':id/enviar')
  @Roles('ADMIN', 'CORRETOR')
  enviar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.enviar(id, atorDe(usuario, request));
  }

  @Post(':id/aceitar')
  @Roles('ADMIN', 'CORRETOR')
  aceitar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.aceitar(id, atorDe(usuario, request));
  }

  @Post(':id/recusar')
  @Roles('ADMIN', 'CORRETOR')
  recusar(
    @Param('id') id: string,
    @Body() body: MotivoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.recusar(id, body.motivo, atorDe(usuario, request));
  }

  @Post(':id/cancelar')
  @Roles('ADMIN', 'CORRETOR')
  cancelar(
    @Param('id') id: string,
    @Body() body: MotivoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.propostas.cancelar(id, body.motivo, atorDe(usuario, request));
  }
}

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
import {
  FormaPagamentoDto,
  ListarFormasDto,
  formaPagamentoSchema,
} from './forma-pagamento.schema.js';
import { FormaPagamentoService } from './forma-pagamento.service.js';

@ApiTags('formas-pagamento')
@ApiBearerAuth()
@Controller('formas-pagamento')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class FormaPagamentoController {
  constructor(private readonly formas: FormaPagamentoService) {}

  @Get()
  listar(@Query() consulta: ListarFormasDto) {
    return this.formas.listar(consulta.somenteAtivas === '1');
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.formas.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: FormaPagamentoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.formas.criar(entradaValidada(formaPagamentoSchema, body), atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: FormaPagamentoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.formas.atualizar(id, entradaValidada(formaPagamentoSchema, body), atorDe(usuario, request));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  excluir(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.formas.excluir(id, atorDe(usuario, request));
  }
}

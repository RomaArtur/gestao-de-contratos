import { BadRequestException, Controller, Get, Param, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import type { Response } from 'express';
import { extname } from 'node:path';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { ArquivoAdapter } from './arquivo.adapter.js';

@ApiBearerAuth()
@Controller('arquivos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class ArquivoController {
  constructor(private readonly arquivos: ArquivoAdapter) {}

  @Get(':nome')
  enviar(@Param('nome') nome: string, @Res() response: Response) {
    if (!/^[0-9a-f-]{36}\.(jpg|jpeg|png|webp|pdf)$/i.test(nome)) {
      throw new BadRequestException('Arquivo inválido.');
    }
    response.type(extname(nome));
    response.sendFile(this.arquivos.caminho(nome));
  }
}

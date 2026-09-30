import { BadRequestException, Controller, Get, Param, Res } from '@nestjs/common';
import type { Response } from 'express';
import { extname } from 'node:path';
import { ArquivoAdapter } from './arquivo.adapter.js';

@Controller('arquivos')
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

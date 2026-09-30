import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import {
  BadRequestException,
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
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { diskStorage } from 'multer';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { atorDe } from '../comum/ator.js';
import { ContratoService } from './contrato.service.js';
import {
  AtualizarContratoDto,
  CategoriaDocumentoContratoDto,
  ContratoDto,
  ListarContratosDto,
  MotivoContratoDto,
  type DadosAtualizacaoContrato,
  type DadosContrato,
} from './contrato.schema.js';

function destinoUpload() {
  return diskStorage({
    destination: (_req, _file, callback) => {
      const diretorio = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
      mkdirSync(diretorio, { recursive: true });
      callback(null, diretorio);
    },
    filename: (_req, file, callback) => {
      const permitidas = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
      const extensao = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${permitidas.includes(extensao) ? extensao : ''}`);
    },
  });
}

@ApiTags('contratos')
@ApiBearerAuth()
@Controller('contratos')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class ContratoController {
  constructor(private readonly contratos: ContratoService) {}

  @Get()
  listar(@Query() consulta: ListarContratosDto) {
    return this.contratos.listar(consulta);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.contratos.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: ContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.criar(body as unknown as DadosContrato, atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: AtualizarContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.atualizar(
      id,
      body as unknown as DadosAtualizacaoContrato,
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
    return this.contratos.excluir(id, atorDe(usuario, request));
  }

  @Post(':id/ativar')
  @Roles('ADMIN', 'CORRETOR')
  ativar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.ativar(id, atorDe(usuario, request));
  }

  @Post(':id/encerrar')
  @Roles('ADMIN', 'CORRETOR')
  encerrar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.encerrar(id, atorDe(usuario, request));
  }

  @Post(':id/cancelar')
  @Roles('ADMIN', 'CORRETOR')
  cancelar(
    @Param('id') id: string,
    @Body() body: MotivoContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.cancelar(id, body.motivo, atorDe(usuario, request));
  }

  @Post(':id/documentos')
  @Roles('ADMIN', 'CORRETOR')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        categoria: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: destinoUpload(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (
        _req,
        file: { mimetype: string },
        callback: (error: Error | null, aceito: boolean) => void,
      ) => {
        const tipos = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        if (!tipos.includes(file.mimetype)) {
          callback(new BadRequestException('Envie um PDF ou imagem de até 10 MB.'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  adicionarDocumento(
    @Param('id') id: string,
    @UploadedFile() arquivo: { filename: string; originalname: string } | undefined,
    @Body() body: CategoriaDocumentoContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    if (!arquivo?.filename) {
      throw new BadRequestException('Selecione um documento.');
    }
    return this.contratos.adicionarDocumento(id, arquivo, body, atorDe(usuario, request));
  }

  @Delete(':id/documentos/:documentoId')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  removerDocumento(
    @Param('id') id: string,
    @Param('documentoId') documentoId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.removerDocumento(id, documentoId, atorDe(usuario, request));
  }
}

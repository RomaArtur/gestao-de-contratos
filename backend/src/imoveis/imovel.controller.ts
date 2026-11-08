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
import {
  EXTENSOES_DOCUMENTO,
  EXTENSOES_IMAGEM,
  TIPOS_DOCUMENTO,
  TIPOS_IMAGEM,
  aceitarArquivo,
  destinoUpload,
} from '../arquivos/upload.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { atorDe } from '../comum/ator.js';
import { entradaValidada } from '../comum/entrada.js';
import { ImovelService } from './imovel.service.js';
import {
  CategoriaDocumentoDto,
  ImovelDto,
  ListarImoveisDto,
  OrdenarFotosDto,
  imovelSchema,
} from './imovel.schema.js';

@ApiTags('imoveis')
@ApiBearerAuth()
@Controller('imoveis')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('ADMIN', 'GESTOR', 'CORRETOR')
export class ImovelController {
  constructor(private readonly imoveis: ImovelService) {}

  @Get()
  listar(@Query() consulta: ListarImoveisDto) {
    return this.imoveis.listar(consulta);
  }

  @Get(':id')
  buscarPorId(@Param('id') id: string) {
    return this.imoveis.buscarPorId(id);
  }

  @Post()
  @Roles('ADMIN', 'CORRETOR')
  criar(
    @Body() body: ImovelDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.imoveis.criar(entradaValidada(imovelSchema, body), atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: ImovelDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.imoveis.atualizar(id, entradaValidada(imovelSchema, body), atorDe(usuario, request));
  }

  @Delete(':id')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  excluir(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.imoveis.excluir(id, atorDe(usuario, request));
  }

  @Post(':id/fotos')
  @Roles('ADMIN', 'CORRETOR')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: destinoUpload(EXTENSOES_IMAGEM),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: aceitarArquivo(TIPOS_IMAGEM, 'Envie uma imagem JPG, PNG ou WebP de até 5 MB.'),
    }),
  )
  adicionarFoto(
    @Param('id') id: string,
    @UploadedFile() arquivo: { filename: string; originalname: string } | undefined,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Selecione uma foto.');
    }
    return this.imoveis.adicionarFoto(id, arquivo, atorDe(usuario, request));
  }

  @Patch(':id/fotos/ordem')
  @Roles('ADMIN', 'CORRETOR')
  reordenarFotos(@Param('id') id: string, @Body() body: OrdenarFotosDto) {
    return this.imoveis.reordenarFotos(id, body);
  }

  @Patch(':id/fotos/:fotoId/principal')
  @Roles('ADMIN', 'CORRETOR')
  definirFotoPrincipal(@Param('id') id: string, @Param('fotoId') fotoId: string) {
    return this.imoveis.definirFotoPrincipal(id, fotoId);
  }

  @Delete(':id/fotos/:fotoId')
  @HttpCode(204)
  @Roles('ADMIN', 'CORRETOR')
  removerFoto(
    @Param('id') id: string,
    @Param('fotoId') fotoId: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.imoveis.removerFoto(id, fotoId, atorDe(usuario, request));
  }

  @Post(':id/documentos')
  @Roles('ADMIN', 'CORRETOR')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: destinoUpload(EXTENSOES_DOCUMENTO),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: aceitarArquivo(TIPOS_DOCUMENTO, 'Envie um PDF ou imagem de até 10 MB.'),
    }),
  )
  adicionarDocumento(
    @Param('id') id: string,
    @UploadedFile() arquivo: { filename: string; originalname: string } | undefined,
    @Body() body: CategoriaDocumentoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Selecione um documento.');
    }
    return this.imoveis.adicionarDocumento(id, arquivo, body, atorDe(usuario, request));
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
    return this.imoveis.removerDocumento(id, documentoId, atorDe(usuario, request));
  }
}

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
import { ImovelService } from './imovel.service.js';
import {
  CategoriaDocumentoDto,
  ImovelDto,
  ListarImoveisDto,
  OrdenarFotosDto,
  type DadosImovel,
} from './imovel.schema.js';

function destinoUpload(permitidas: string[]) {
  return diskStorage({
    destination: (_req, _file, callback) => {
      const diretorio = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
      mkdirSync(diretorio, { recursive: true });
      callback(null, diretorio);
    },
    filename: (_req, file, callback) => {
      const extensao = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${permitidas.includes(extensao) ? extensao : ''}`);
    },
  });
}

function aceitar(tipos: string[], mensagem: string) {
  return (
    _req: Request,
    file: { mimetype: string },
    callback: (error: Error | null, aceito: boolean) => void,
  ) => {
    if (!tipos.includes(file.mimetype)) {
      callback(new BadRequestException(mensagem), false);
      return;
    }
    callback(null, true);
  };
}

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
    return this.imoveis.criar(body as unknown as DadosImovel, atorDe(usuario, request));
  }

  @Patch(':id')
  @Roles('ADMIN', 'CORRETOR')
  atualizar(
    @Param('id') id: string,
    @Body() body: ImovelDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.imoveis.atualizar(id, body as unknown as DadosImovel, atorDe(usuario, request));
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
      storage: destinoUpload(['.jpg', '.jpeg', '.png', '.webp']),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: aceitar(
        ['image/jpeg', 'image/png', 'image/webp'],
        'Envie uma imagem JPG, PNG ou WebP de até 5 MB.',
      ),
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
      storage: destinoUpload(['.pdf', '.jpg', '.jpeg', '.png', '.webp']),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: aceitar(
        ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        'Envie um PDF ou imagem de até 10 MB.',
      ),
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

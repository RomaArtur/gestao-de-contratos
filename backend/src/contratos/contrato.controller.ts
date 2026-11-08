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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiCreatedResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { EXTENSOES_DOCUMENTO, TIPOS_DOCUMENTO, aceitarArquivo, destinoUpload } from '../arquivos/upload.js';
import { CurrentUser, type AuthenticatedUser } from '../auth/current-user.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { atorDe } from '../comum/ator.js';
import { entradaValidada } from '../comum/entrada.js';
import { ContratoService } from './contrato.service.js';
import {
  AtualizarContratoDto,
  CategoriaDocumentoContratoDto,
  ContratoDto,
  DocumentoContratoDto,
  ListarContratosDto,
  MotivoContratoDto,
  atualizarContratoSchema,
  contratoSchema,
  documentoContratoSchema,
} from './contrato.schema.js';

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
    return this.contratos.criar(entradaValidada(contratoSchema, body), atorDe(usuario, request));
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
      entradaValidada(atualizarContratoSchema, body),
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

  @Patch(':id/documento')
  @Roles('ADMIN', 'CORRETOR')
  salvarDocumento(
    @Param('id') id: string,
    @Body() body: DocumentoContratoDto,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    const dados = entradaValidada(documentoContratoSchema, body);
    return this.contratos.salvarDocumento(id, dados.conteudo, dados.edicaoExplicita, atorDe(usuario, request));
  }

  @Post(':id/finalizar')
  @Roles('ADMIN', 'CORRETOR')
  @ApiCreatedResponse({
    description:
      'Contrato finalizado. A resposta inclui emailEnviado e emailDestino. Se o envio falhar, o contrato permanece finalizado.',
  })
  finalizar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.finalizar(id, atorDe(usuario, request));
  }

  @Post(':id/reenviar')
  @Roles('ADMIN', 'CORRETOR')
  @ApiCreatedResponse({
    description: 'E-mail enviado ao contato. O reenvio só é registrado depois que o envio é aceito.',
    schema: {
      type: 'object',
      required: ['email', 'emailEnviado'],
      properties: {
        email: { type: 'string', format: 'email' },
        emailEnviado: { type: 'boolean' },
      },
    },
  })
  reenviar(
    @Param('id') id: string,
    @CurrentUser() usuario: AuthenticatedUser,
    @Req() request: Request,
  ) {
    return this.contratos.reenviar(id, atorDe(usuario, request));
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
      storage: destinoUpload(EXTENSOES_DOCUMENTO),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: aceitarArquivo(TIPOS_DOCUMENTO, 'Envie um PDF ou imagem de até 10 MB.'),
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

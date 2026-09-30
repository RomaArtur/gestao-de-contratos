import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CATEGORIAS_DOCUMENTO_CONTRATO,
  SITUACOES_CONTRATO,
} from '../database/entidades-contrato.js';

const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a data.');

function periodoValido(valor: { dataInicio: string; vencimento: string }, ctx: z.RefinementCtx) {
  if (valor.vencimento < valor.dataInicio) {
    ctx.addIssue({
      code: 'custom',
      path: ['vencimento'],
      message: 'O vencimento precisa ser igual ou posterior ao início.',
    });
  }
}

export const contratoSchema = z
  .object({
    propostaId: z.uuid(),
    dataInicio: data,
    vencimento: data,
    observacoes: z.string().trim().max(4000).optional().or(z.literal('')),
  })
  .superRefine(periodoValido);

export class ContratoDto extends createZodDto(contratoSchema) {}

export type DadosContrato = z.infer<typeof contratoSchema>;

export const atualizarContratoSchema = z
  .object({
    dataInicio: data,
    vencimento: data,
    observacoes: z.string().trim().max(4000).optional().or(z.literal('')),
  })
  .superRefine(periodoValido);

export class AtualizarContratoDto extends createZodDto(atualizarContratoSchema) {}

export type DadosAtualizacaoContrato = z.infer<typeof atualizarContratoSchema>;

export const listarContratosSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(80).optional().or(z.literal('')),
  situacao: z.enum(SITUACOES_CONTRATO).optional().or(z.literal('')),
  imovelId: z.uuid().optional().or(z.literal('')),
  clienteId: z.uuid().optional().or(z.literal('')),
});

export class ListarContratosDto extends createZodDto(listarContratosSchema) {}

export const motivoContratoSchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo.').max(500),
});

export class MotivoContratoDto extends createZodDto(motivoContratoSchema) {}

export const categoriaDocumentoContratoSchema = z.object({
  categoria: z.enum(CATEGORIAS_DOCUMENTO_CONTRATO),
});

export class CategoriaDocumentoContratoDto extends createZodDto(categoriaDocumentoContratoSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import {
  CATEGORIAS_DOCUMENTO_CONTRATO,
  SITUACOES_CONTRATO,
} from '../database/entidades-contrato.js';
import { FINALIDADES_PROPOSTA } from '../database/entidades-proposta.js';

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

const vinculo = z.uuid().optional().or(z.literal(''));
const valor = z.number().positive().max(999_999_999_999);

export const contratoSchema = z
  .object({
    propostaId: vinculo,
    imovelId: vinculo,
    clienteId: vinculo,
    finalidade: z.enum(FINALIDADES_PROPOSTA).optional().or(z.literal('')),
    valor: valor.optional(),
    formaPagamentoId: vinculo,
    dataInicio: data,
    vencimento: data,
    observacoes: z.string().trim().max(4000).optional().or(z.literal('')),
  })
  .superRefine((valorContrato, ctx) => {
    periodoValido(valorContrato, ctx);
    if (valorContrato.propostaId) return;
    if (!valorContrato.imovelId) {
      ctx.addIssue({ code: 'custom', path: ['imovelId'], message: 'Selecione o imóvel.' });
    }
    if (!valorContrato.clienteId) {
      ctx.addIssue({ code: 'custom', path: ['clienteId'], message: 'Selecione o cliente.' });
    }
    if (!valorContrato.finalidade) {
      ctx.addIssue({ code: 'custom', path: ['finalidade'], message: 'Selecione a finalidade.' });
    }
    if (valorContrato.valor == null) {
      ctx.addIssue({ code: 'custom', path: ['valor'], message: 'Informe o valor.' });
    }
  });

export class ContratoDto extends createZodDto(contratoSchema) {}

export type DadosContrato = z.infer<typeof contratoSchema>;

export const atualizarContratoSchema = z
  .object({
    imovelId: vinculo,
    clienteId: vinculo,
    finalidade: z.enum(FINALIDADES_PROPOSTA).optional().or(z.literal('')),
    valor: valor.optional(),
    formaPagamentoId: vinculo,
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
  recorte: z.enum(['ativos', 'vencidos', 'proximos']).optional().or(z.literal('')),
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

export const documentoContratoSchema = z.object({
  conteudo: z.string().trim().min(1, 'O contrato está vazio.').max(200_000),
  edicaoExplicita: z.boolean().optional(),
});

export class DocumentoContratoDto extends createZodDto(documentoContratoSchema) {}

export const gerarContratoSchema = z
  .object({
    dataInicio: data,
    vencimento: data,
  })
  .superRefine(periodoValido);

export class GerarContratoDto extends createZodDto(gerarContratoSchema) {}

export type DadosGeracaoContrato = z.infer<typeof gerarContratoSchema>;

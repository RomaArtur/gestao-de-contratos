import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { FINALIDADES_PROPOSTA, SITUACOES_PROPOSTA } from '../database/entidades-proposta.js';

const textoOpcional = z.string().trim().max(4000).optional().or(z.literal(''));

export const propostaSchema = z.object({
  imovelId: z.uuid(),
  clienteId: z.uuid(),
  finalidade: z.enum(FINALIDADES_PROPOSTA),
  valor: z.number().positive().max(999_999_999_999),
  condicoes: textoOpcional,
  validade: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe a validade.')
    .optional()
    .or(z.literal('')),
});

export class PropostaDto extends createZodDto(propostaSchema) {}

export type DadosProposta = z.infer<typeof propostaSchema>;

export const listarPropostasSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(80).optional().or(z.literal('')),
  situacao: z.enum(SITUACOES_PROPOSTA).optional().or(z.literal('')),
  imovelId: z.uuid().optional().or(z.literal('')),
  clienteId: z.uuid().optional().or(z.literal('')),
});

export class ListarPropostasDto extends createZodDto(listarPropostasSchema) {}

export const motivoSchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo.').max(500),
});

export class MotivoDto extends createZodDto(motivoSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const formaPagamentoSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome.').max(80),
  ativo: z.boolean().optional(),
});

export class FormaPagamentoDto extends createZodDto(formaPagamentoSchema) {}

export type DadosFormaPagamento = z.infer<typeof formaPagamentoSchema>;

export const listarFormasSchema = z.object({
  somenteAtivas: z.enum(['1']).optional().or(z.literal('')),
});

export class ListarFormasDto extends createZodDto(listarFormasSchema) {}

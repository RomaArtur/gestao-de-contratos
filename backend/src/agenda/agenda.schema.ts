import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { TIPOS_EVENTO } from '../database/entidades-agenda.js';

const instante = z.string().min(16, 'Informe a data e a hora.');
const vinculo = z.uuid().optional().or(z.literal(''));

export const eventoSchema = z
  .object({
    titulo: z.string().trim().min(3, 'Informe o título.').max(160),
    tipo: z.enum(TIPOS_EVENTO),
    inicio: instante,
    fim: instante,
    descricao: z.string().trim().max(2000).optional().or(z.literal('')),
    imovelId: vinculo,
    clienteId: vinculo,
    contratoId: vinculo,
  })
  .superRefine((valor, ctx) => {
    if (new Date(valor.fim).getTime() <= new Date(valor.inicio).getTime()) {
      ctx.addIssue({
        code: 'custom',
        path: ['fim'],
        message: 'O fim precisa ser posterior ao início.',
      });
    }
  });

export class EventoDto extends createZodDto(eventoSchema) {}

export type DadosEvento = z.infer<typeof eventoSchema>;

export const listarAgendaSchema = z.object({
  inicio: instante,
  fim: instante,
});

export class ListarAgendaDto extends createZodDto(listarAgendaSchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { enderecoSchema } from '../comum/endereco.js';
import { isValidCnpj, isValidCpf, onlyDigits } from '../common/crypto/documents.js';

const textoOpcional = z.string().trim().optional().or(z.literal(''));

export const proprietarioSchema = z
  .object({
    tipoPessoa: z.enum(['FISICA', 'JURIDICA']),
    nome: z.string().trim().min(3).max(160),
    nomeFantasia: z.string().trim().max(160).optional().or(z.literal('')),
    documento: z.string().trim().min(11),
    dataNascimento: textoOpcional,
    telefone: z.string().trim().min(8).max(20),
    email: z.string().trim().email('E-mail inválido.'),
    nomeResponsavel: z.string().trim().max(160).optional().or(z.literal('')),
    endereco: enderecoSchema,
  })
  .superRefine((valor, ctx) => {
    if (valor.tipoPessoa === 'FISICA') {
      if (!isValidCpf(valor.documento)) {
        ctx.addIssue({ code: 'custom', path: ['documento'], message: 'CPF inválido.' });
      }
      if (valor.dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(valor.dataNascimento)) {
        ctx.addIssue({
          code: 'custom',
          path: ['dataNascimento'],
          message: 'Data de nascimento inválida.',
        });
      }
      return;
    }
    if (!isValidCnpj(valor.documento)) {
      ctx.addIssue({ code: 'custom', path: ['documento'], message: 'CNPJ inválido.' });
    }
    if (!valor.nomeResponsavel || valor.nomeResponsavel.trim().length < 3) {
      ctx.addIssue({
        code: 'custom',
        path: ['nomeResponsavel'],
        message: 'Informe o responsável.',
      });
    }
  });

export class ProprietarioDto extends createZodDto(proprietarioSchema) {}

export type DadosProprietario = z.infer<typeof proprietarioSchema>;

export const listarProprietariosSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(200).default(20),
  busca: z.string().trim().max(80).optional().or(z.literal('')),
  tipoPessoa: z.enum(['FISICA', 'JURIDICA']).optional().or(z.literal('')),
});

export class ListarProprietariosDto extends createZodDto(listarProprietariosSchema) {}

export function digitosDocumento(documento: string) {
  return onlyDigits(documento);
}

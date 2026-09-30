import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { isValidCnpj, isValidCpf, onlyDigits } from '../common/crypto/documents.js';
import { enderecoSchema } from '../comum/endereco.js';
import { TIPOS_CLIENTE } from '../database/entidades-catalogo.js';

export const clienteSchema = z.object({
  nome: z.string().trim().min(3).max(160),
  documento: z
    .string()
    .trim()
    .refine((valor) => isValidCpf(valor) || isValidCnpj(valor), 'Informe um CPF ou CNPJ válido.'),
  telefone: z.string().trim().min(8).max(20),
  whatsapp: z.string().trim().max(20).optional().or(z.literal('')),
  email: z.string().trim().email('E-mail inválido.'),
  endereco: enderecoSchema,
  tipo: z.enum(TIPOS_CLIENTE),
  observacoes: z.string().trim().max(2000).optional().or(z.literal('')),
});

export class ClienteDto extends createZodDto(clienteSchema) {}

export type DadosCliente = z.infer<typeof clienteSchema>;

export const listarClientesSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(80).optional().or(z.literal('')),
  tipo: z.enum(TIPOS_CLIENTE).optional().or(z.literal('')),
});

export class ListarClientesDto extends createZodDto(listarClientesSchema) {}

export function digitosDocumento(documento: string) {
  return onlyDigits(documento);
}

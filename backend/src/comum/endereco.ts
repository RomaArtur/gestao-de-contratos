import { z } from 'zod';

export const enderecoSchema = z.object({
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos.'),
  logradouro: z.string().trim().min(1).max(160),
  numero: z.string().trim().min(1).max(20),
  complemento: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((valor) => valor || null),
  bairro: z.string().trim().min(1).max(80),
  cidade: z.string().trim().min(1).max(80),
  uf: z
    .string()
    .trim()
    .length(2, 'UF deve ter 2 letras.')
    .transform((valor) => valor.toUpperCase()),
});

export type EnderecoInput = z.infer<typeof enderecoSchema>;

export function colunasEndereco(endereco: EnderecoInput) {
  return {
    cep: endereco.cep,
    logradouro: endereco.logradouro,
    numero: endereco.numero,
    complemento: endereco.complemento,
    bairro: endereco.bairro,
    cidade: endereco.cidade,
    uf: endereco.uf,
  };
}

export function enderecoDe(registro: {
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro: string;
  cidade: string;
  uf: string;
}) {
  return {
    cep: registro.cep,
    logradouro: registro.logradouro,
    numero: registro.numero,
    complemento: registro.complemento,
    bairro: registro.bairro,
    cidade: registro.cidade,
    uf: registro.uf,
  };
}

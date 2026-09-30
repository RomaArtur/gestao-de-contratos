import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { enderecoSchema } from '../comum/endereco.js';
import {
  CATEGORIAS_DOCUMENTO,
  FINALIDADES_IMOVEL,
  SITUACOES_IMOVEL,
  TIPOS_IMOVEL,
} from '../database/entidades-catalogo.js';

const valor = z.number().nonnegative().max(999_999_999_999).nullable();
const numeroOpcional = z.preprocess(
  (entrada) => (entrada === '' || entrada === undefined ? undefined : entrada),
  z.coerce.number().nonnegative().optional(),
);

export const imovelSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .min(1)
      .max(32)
      .transform((entrada) => entrada.toUpperCase()),
    proprietarioId: z.uuid(),
    tipo: z.enum(TIPOS_IMOVEL),
    finalidade: z.enum(FINALIDADES_IMOVEL),
    situacao: z.enum(SITUACOES_IMOVEL),
    endereco: enderecoSchema,
    area: z.number().positive().max(1_000_000),
    quartos: z.number().int().min(0).max(99),
    banheiros: z.number().int().min(0).max(99),
    vagas: z.number().int().min(0).max(99),
    descricao: z.string().trim().max(4000).optional().or(z.literal('')),
    valorVenda: valor.optional(),
    valorAluguel: valor.optional(),
    valorCondominio: valor.optional(),
    valorIptu: valor.optional(),
  })
  .superRefine((entrada, ctx) => {
    const exigeVenda = entrada.finalidade === 'VENDA' || entrada.finalidade === 'VENDA_ALUGUEL';
    const exigeAluguel = entrada.finalidade === 'ALUGUEL' || entrada.finalidade === 'VENDA_ALUGUEL';
    if (exigeVenda && entrada.valorVenda == null) {
      ctx.addIssue({ code: 'custom', path: ['valorVenda'], message: 'Informe o valor de venda.' });
    }
    if (exigeAluguel && entrada.valorAluguel == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['valorAluguel'],
        message: 'Informe o valor de aluguel.',
      });
    }
  });

export class ImovelDto extends createZodDto(imovelSchema) {}

export type DadosImovel = z.infer<typeof imovelSchema>;

export const listarImoveisSchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  tamanhoPagina: z.coerce.number().int().min(1).max(100).default(20),
  busca: z.string().trim().max(80).optional().or(z.literal('')),
  cidade: z.string().trim().max(80).optional().or(z.literal('')),
  bairro: z.string().trim().max(80).optional().or(z.literal('')),
  tipo: z.enum(TIPOS_IMOVEL).optional().or(z.literal('')),
  finalidade: z.enum(FINALIDADES_IMOVEL).optional().or(z.literal('')),
  situacao: z.enum(SITUACOES_IMOVEL).optional().or(z.literal('')),
  proprietarioId: z.uuid().optional().or(z.literal('')),
  precoMinimo: numeroOpcional,
  precoMaximo: numeroOpcional,
  areaMinima: numeroOpcional,
  quartos: numeroOpcional,
  vagas: numeroOpcional,
});

export class ListarImoveisDto extends createZodDto(listarImoveisSchema) {}

export const ordenarFotosSchema = z.object({
  ids: z.array(z.uuid()).min(1).max(20),
});

export class OrdenarFotosDto extends createZodDto(ordenarFotosSchema) {}

export const categoriaDocumentoSchema = z.object({
  categoria: z.enum(CATEGORIAS_DOCUMENTO),
});

export class CategoriaDocumentoDto extends createZodDto(categoriaDocumentoSchema) {}

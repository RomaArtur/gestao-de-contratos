import { BadRequestException } from '@nestjs/common';
import { ImovelService } from './imovel.service.js';
import type { DadosImovel } from './imovel.schema.js';

const ator = { usuarioId: 'user-1' };

const endereco = {
  cep: '80000000',
  logradouro: 'Rua A',
  numero: '10',
  complemento: null,
  bairro: 'Centro',
  cidade: 'Curitiba',
  uf: 'PR',
};

function dados(situacao: DadosImovel['situacao'], descricao = 'Apto'): DadosImovel {
  return {
    codigo: 'AP-1',
    proprietarioId: 'prop-1',
    tipo: 'APARTAMENTO',
    finalidade: 'VENDA',
    situacao,
    endereco,
    area: 40,
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    descricao,
    valorVenda: 250000,
    valorAluguel: null,
    valorCondominio: null,
    valorIptu: null,
  };
}

function imovel(situacao: string) {
  return {
    id: 'imovel-1',
    codigo: 'AP-1',
    tipo: 'APARTAMENTO',
    finalidade: 'VENDA',
    situacao,
    area: 40,
    quartos: 2,
    banheiros: 1,
    vagas: 1,
    descricao: 'Apto',
    valorVenda: 250000,
    valorAluguel: null,
    valorCondominio: null,
    valorIptu: null,
    proprietarioId: 'prop-1',
    proprietario: { id: 'prop-1', nome: 'Ana' },
    fotos: [],
    documentos: [],
    ...endereco,
  };
}

describe('ImovelService situação', () => {
  const repositorio = {
    proprietarioExiste: vi.fn(async () => ({ id: 'prop-1' })),
    criar: vi.fn(),
    atualizar: vi.fn(async (registro: { situacao: string; descricao: string | null }, colunas: { situacao: string; descricao: string | null }) => {
      Object.assign(registro, colunas);
    }),
    buscarPorId: vi.fn(),
  };

  let servico: ImovelService;

  beforeEach(() => {
    vi.clearAllMocks();
    servico = new ImovelService(repositorio as never, {} as never, { record: vi.fn() } as never);
  });

  it('cria imóvel disponível', async () => {
    const registro = imovel('DISPONIVEL');
    repositorio.criar.mockImplementation(async (colunas: { situacao: string }) => Object.assign(registro, colunas));
    repositorio.buscarPorId.mockResolvedValue(registro);

    const criado = await servico.criar(dados('DISPONIVEL'), ator);

    expect(criado.situacao).toBe('DISPONIVEL');
  });

  it('não deixa o cadastro gravar situação de proposta ou contrato', async () => {
    await expect(servico.criar(dados('VENDIDO'), ator)).rejects.toThrow(BadRequestException);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('permite inativar um imóvel que ainda não entrou no fluxo', async () => {
    const registro = imovel('DISPONIVEL');
    repositorio.buscarPorId.mockResolvedValue(registro);

    const atualizado = await servico.atualizar('imovel-1', dados('INATIVO'), ator);

    expect(atualizado.situacao).toBe('INATIVO');
  });

  it('recusa trocar a situação enquanto a proposta ou o contrato mandam nela', async () => {
    repositorio.buscarPorId.mockResolvedValue(imovel('RESERVADO'));

    await expect(servico.atualizar('imovel-1', dados('DISPONIVEL'), ator)).rejects.toThrow(
      'A situação deste imóvel é definida pela proposta ou pelo contrato.',
    );
    expect(repositorio.atualizar).not.toHaveBeenCalled();
  });

  it('salva os outros campos sem alterar a situação definida pelo fluxo', async () => {
    const registro = imovel('ALUGADO');
    repositorio.buscarPorId.mockResolvedValue(registro);

    const atualizado = await servico.atualizar('imovel-1', dados('ALUGADO', 'Reforma'), ator);

    expect(atualizado.situacao).toBe('ALUGADO');
    expect(atualizado.descricao).toBe('Reforma');
  });
});

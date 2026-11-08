import { BadRequestException } from '@nestjs/common';
import { SituacaoImovel } from '../imoveis/situacao-imovel.js';
import { PropostaService } from './proposta.service.js';
import type { DadosProposta } from './proposta.schema.js';

const ator = { usuarioId: 'user-1' };

function imovelMutavel(situacao: string, finalidade = 'VENDA') {
  const registro = {
    id: 'imovel-1',
    codigo: 'AP-1',
    situacao,
    finalidade,
    update: vi.fn(async (dados: { situacao?: string }) => {
      if (dados.situacao) registro.situacao = dados.situacao;
      return registro;
    }),
  };
  return registro;
}

type Historico = {
  situacaoAnterior: string | null;
  situacaoNova: string;
  observacao: string | null;
  createdAt: Date;
  usuario: { name: string };
};

function memoria(situacao = 'DISPONIVEL', finalidade = 'VENDA') {
  const imovel = imovelMutavel(situacao, finalidade);
  const propostas: Array<{
    id: string;
    imovelId: string;
    clienteId: string;
    finalidade: string;
    valor: number;
    situacao: string;
    motivo: string | null;
    validade: string | null;
    condicoes: string | null;
    createdAt: Date;
    historico: Historico[];
    imovel: { codigo: string };
    cliente: { nome: string };
    corretor: { name: string };
    update: (dados: Record<string, unknown>) => Promise<unknown>;
  }> = [];

  const repositorio = {
    buscarImovel: vi.fn(async (id: string) => (id === imovel.id ? imovel : null)),
    buscarCliente: vi.fn(async (id: string) => (id === 'cliente-1' ? { id } : null)),
    criar: vi.fn(async (dados: Record<string, unknown>) => {
      const registro = {
        id: `proposta-${propostas.length + 1}`,
        imovelId: String(dados.imovelId),
        clienteId: String(dados.clienteId),
        finalidade: String(dados.finalidade),
        valor: Number(dados.valor),
        situacao: String(dados.situacao),
        motivo: (dados.motivo as string | null) ?? null,
        validade: (dados.validade as string | null) ?? null,
        condicoes: (dados.condicoes as string | null) ?? null,
        createdAt: new Date(),
        historico: [] as Historico[],
        imovel: { codigo: imovel.codigo },
        cliente: { nome: 'Cliente' },
        corretor: { name: 'Ana' },
        update: vi.fn(async (alteracao: Record<string, unknown>) => {
          Object.assign(registro, alteracao);
          return registro;
        }),
      };
      propostas.push(registro);
      return registro;
    }),
    buscarPorId: vi.fn(async (id: string) => propostas.find((item) => item.id === id) ?? null),
    atualizar: vi.fn(async (proposta: { update: (dados: Record<string, unknown>) => Promise<unknown> }, dados: Record<string, unknown>) =>
      proposta.update(dados),
    ),
    registrarHistorico: vi.fn(async (dados: {
      propostaId: string;
      situacaoAnterior: string | null;
      situacaoNova: string;
      observacao: string | null;
    }) => {
      const proposta = propostas.find((item) => item.id === dados.propostaId);
      proposta?.historico.push({
        situacaoAnterior: dados.situacaoAnterior,
        situacaoNova: dados.situacaoNova,
        observacao: dados.observacao,
        createdAt: new Date(),
        usuario: { name: 'Ana' },
      });
    }),
    listarOutrasEnviadas: vi.fn(async (imovelId: string, finalidadeProposta: string, propostaId: string) =>
      propostas.filter(
        (item) =>
          item.imovelId === imovelId &&
          item.finalidade === finalidadeProposta &&
          item.situacao === 'ENVIADA' &&
          item.id !== propostaId,
      ),
    ),
    contarAtivas: vi.fn(async (imovelId: string) =>
      propostas.filter(
        (item) => item.imovelId === imovelId && (item.situacao === 'ENVIADA' || item.situacao === 'ACEITA'),
      ).length,
    ),
    contarPorSituacao: vi.fn(async (imovelId: string, situacao: string) =>
      propostas.filter((item) => item.imovelId === imovelId && item.situacao === situacao).length,
    ),
    excluir: vi.fn(),
  };

  return { imovel, propostas, repositorio };
}

function dados(parcial: Partial<DadosProposta> = {}): DadosProposta {
  return {
    imovelId: 'imovel-1',
    clienteId: 'cliente-1',
    finalidade: 'VENDA',
    valor: 1000,
    condicoes: '',
    validade: '',
    ...parcial,
  };
}

function servicoDe(repositorio: object) {
  return new PropostaService(
    repositorio as never,
    { record: vi.fn() } as never,
    new SituacaoImovel(),
    { transaction: async (fn: (tx: object) => unknown) => fn({}) } as never,
    { garantirUtilizavel: vi.fn(async (id: string) => id) } as never,
  );
}

describe('PropostaService', () => {
  it('recusa criar proposta para imóvel que não está aberto', async () => {
    const { repositorio } = memoria('ALUGADO');
    const servico = servicoDe(repositorio);

    await expect(servico.criar(dados(), ator)).rejects.toThrow(BadRequestException);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('cria em rascunho sem mudar a situação do imóvel', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);

    const criada = await servico.criar(dados(), ator);

    expect(criada.situacao).toBe('RASCUNHO');
    expect(imovel.situacao).toBe('DISPONIVEL');
  });

  it('enviar tira o imóvel disponível e coloca em negociação', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criada = await servico.criar(dados(), ator);

    const enviada = await servico.enviar(criada.id, ator);

    expect(enviada.situacao).toBe('ENVIADA');
    expect(imovel.situacao).toBe('EM_NEGOCIACAO');
  });

  it('aceitar reserva o imóvel e recusa as outras enviadas da mesma finalidade', async () => {
    const { imovel, propostas, repositorio } = memoria('DISPONIVEL', 'VENDA_ALUGUEL');
    const servico = servicoDe(repositorio);
    const venda = await servico.criar(dados({ finalidade: 'VENDA' }), ator);
    const outraVenda = await servico.criar(dados({ finalidade: 'VENDA', valor: 2000 }), ator);
    const aluguel = await servico.criar(dados({ finalidade: 'ALUGUEL', valor: 900 }), ator);
    await servico.enviar(venda.id, ator);
    await servico.enviar(outraVenda.id, ator);
    await servico.enviar(aluguel.id, ator);

    const aceita = await servico.aceitar(venda.id, ator);

    expect(aceita.situacao).toBe('ACEITA');
    expect(imovel.situacao).toBe('RESERVADO');
    expect(propostas.find((item) => item.id === outraVenda.id)?.situacao).toBe('RECUSADA');
    expect(propostas.find((item) => item.id === outraVenda.id)?.motivo).toBe(
      'Substituída por outra proposta aceita.',
    );
    expect(propostas.find((item) => item.id === aluguel.id)?.situacao).toBe('ENVIADA');
  });

  it('não aceita outra proposta quando o imóvel já tem uma aceita', async () => {
    const { repositorio } = memoria('DISPONIVEL', 'VENDA_ALUGUEL');
    const servico = servicoDe(repositorio);
    const venda = await servico.criar(dados({ finalidade: 'VENDA' }), ator);
    const aluguel = await servico.criar(dados({ finalidade: 'ALUGUEL', valor: 900 }), ator);
    await servico.enviar(venda.id, ator);
    await servico.enviar(aluguel.id, ator);
    await servico.aceitar(venda.id, ator);

    await expect(servico.aceitar(aluguel.id, ator)).rejects.toThrow(
      'Já existe uma proposta aceita para este imóvel.',
    );
  });

  it('envia proposta válida no dia local quando o UTC já virou o dia', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T23:30:00-03:00'));
    try {
      const { repositorio } = memoria();
      const servico = servicoDe(repositorio);
      const criada = await servico.criar(dados({ validade: '2026-11-08' }), ator);

      const enviada = await servico.enviar(criada.id, ator);

      expect(enviada.situacao).toBe('ENVIADA');
    } finally {
      vi.useRealTimers();
    }
  });

  it('recusar a última proposta enviada devolve o imóvel para disponível', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criada = await servico.criar(dados(), ator);
    await servico.enviar(criada.id, ator);

    const recusada = await servico.recusar(criada.id, 'Valor baixo', ator);

    expect(recusada.situacao).toBe('RECUSADA');
    expect(imovel.situacao).toBe('DISPONIVEL');
  });

  it('cancelar uma enviada mantém o imóvel em negociação se ainda houver outra ativa', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const primeira = await servico.criar(dados(), ator);
    const segunda = await servico.criar(dados({ valor: 1500 }), ator);
    await servico.enviar(primeira.id, ator);
    await servico.enviar(segunda.id, ator);

    await servico.cancelar(primeira.id, 'Desistiu', ator);

    expect(imovel.situacao).toBe('EM_NEGOCIACAO');
  });

  it('cancelar rascunho não libera nem reserva o imóvel', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criada = await servico.criar(dados(), ator);

    await servico.cancelar(criada.id, 'Desistiu', ator);

    expect(imovel.situacao).toBe('DISPONIVEL');
    expect(imovel.update).not.toHaveBeenCalled();
  });

  it('não envia proposta com validade vencida', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criada = await servico.criar(dados({ validade: '2000-01-01' }), ator);

    await expect(servico.enviar(criada.id, ator)).rejects.toThrow(
      'A validade da proposta já passou.',
    );
  });
});

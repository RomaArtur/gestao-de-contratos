import { BadRequestException } from '@nestjs/common';
import { SituacaoImovel } from '../imoveis/situacao-imovel.js';
import { ContratoService } from './contrato.service.js';
import type { DadosContrato } from './contrato.schema.js';

const ator = { usuarioId: 'user-1' };

function imovelMutavel(situacao: string) {
  const registro = {
    id: 'imovel-1',
    codigo: 'AP-1',
    situacao,
    update: vi.fn(async (dados: { situacao?: string }) => {
      if (dados.situacao) registro.situacao = dados.situacao;
      return registro;
    }),
  };
  return registro;
}

function memoria(situacaoImovel = 'RESERVADO') {
  const imovel = imovelMutavel(situacaoImovel);
  const propostas = new Map<string, { id: string; situacao: string; imovelId: string; clienteId: string; finalidade: string; valor: number }>();
  const contratos: Array<{
    id: string;
    codigo: string;
    propostaId: string;
    imovelId: string;
    clienteId: string;
    finalidade: string;
    valor: number;
    situacao: string;
    motivo: string | null;
    dataInicio: string;
    vencimento: string;
    observacoes: string | null;
    documentos: [];
    historico: Array<{ situacaoNova: string; createdAt: Date; usuario: { name: string } }>;
    imovel: { codigo: string };
    cliente: { nome: string };
    corretor: { name: string };
    createdAt: Date;
    update: (dados: Record<string, unknown>) => Promise<unknown>;
  }> = [];

  propostas.set('proposta-1', {
    id: 'proposta-1',
    situacao: 'ACEITA',
    imovelId: imovel.id,
    clienteId: 'cliente-1',
    finalidade: 'VENDA',
    valor: 300000,
  });

  const repositorio = {
    buscarProposta: vi.fn(async (id: string) => propostas.get(id) ?? null),
    buscarPorProposta: vi.fn(async (propostaId: string) => contratos.find((item) => item.propostaId === propostaId) ?? null),
    buscarImovel: vi.fn(async (id: string) => (id === imovel.id ? imovel : null)),
    proximoCodigo: vi.fn(async () => `CTR-${String(contratos.length + 1).padStart(4, '0')}`),
    criar: vi.fn(async (dados: Record<string, unknown>) => {
      const registro = {
        id: `contrato-${contratos.length + 1}`,
        codigo: String(dados.codigo),
        propostaId: String(dados.propostaId),
        imovelId: String(dados.imovelId),
        clienteId: String(dados.clienteId),
        finalidade: String(dados.finalidade),
        valor: Number(dados.valor),
        situacao: String(dados.situacao),
        motivo: (dados.motivo as string | null) ?? null,
        dataInicio: String(dados.dataInicio),
        vencimento: String(dados.vencimento),
        observacoes: (dados.observacoes as string | null) ?? null,
        documentos: [] as [],
        historico: [] as Array<{ situacaoNova: string; createdAt: Date; usuario: { name: string } }>,
        imovel: { codigo: imovel.codigo },
        cliente: { nome: 'Cliente' },
        corretor: { name: 'Ana' },
        createdAt: new Date(),
        update: vi.fn(async (alteracao: Record<string, unknown>) => {
          Object.assign(registro, alteracao);
          return registro;
        }),
      };
      contratos.push(registro);
      return registro;
    }),
    buscarPorId: vi.fn(async (id: string) => contratos.find((item) => item.id === id) ?? null),
    atualizar: vi.fn(async (contrato: { update: (dados: Record<string, unknown>) => Promise<unknown> }, dados: Record<string, unknown>) =>
      contrato.update(dados),
    ),
    registrarHistorico: vi.fn(async (dados: { contratoId: string; situacaoNova: string }) => {
      const contrato = contratos.find((item) => item.id === dados.contratoId);
      contrato?.historico.push({
        situacaoNova: dados.situacaoNova,
        createdAt: new Date(),
        usuario: { name: 'Ana' },
      });
    }),
    contarVigentes: vi.fn(async (imovelId: string, contratoId: string) =>
      contratos.filter(
        (item) => item.imovelId === imovelId && item.situacao === 'VIGENTE' && item.id !== contratoId,
      ).length,
    ),
    contarPropostas: vi.fn(async (imovelId: string, situacoes: string[], _transacao?: unknown, excetoId?: string | null) =>
      [...propostas.values()].filter(
        (item) => item.imovelId === imovelId && situacoes.includes(item.situacao) && item.id !== excetoId,
      ).length,
    ),
    excluir: vi.fn(),
  };

  return { imovel, propostas, contratos, repositorio };
}

const dados: DadosContrato = {
  propostaId: 'proposta-1',
  dataInicio: '2026-01-01',
  vencimento: '2027-01-01',
  observacoes: '',
};

function servicoDe(repositorio: object) {
  return new ContratoService(
    repositorio as never,
    { remover: vi.fn() } as never,
    { record: vi.fn() } as never,
    new SituacaoImovel(),
    { transaction: async (fn: (tx: object) => unknown) => fn({}) } as never,
    { garantirUtilizavel: vi.fn(async (id: string) => id) } as never,
    { decrypt: (valor: string) => valor } as never,
    { enviar: vi.fn() } as never,
  );
}

describe('ContratoService', () => {
  it('só cria contrato a partir de proposta aceita', async () => {
    const { propostas, repositorio } = memoria();
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, situacao: 'ENVIADA' });
    const servico = servicoDe(repositorio);

    await expect(servico.criar(dados, ator)).rejects.toThrow('Selecione uma proposta aceita.');
  });

  it('não cria segundo contrato para a mesma proposta', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);
    await servico.criar(dados, ator);

    await expect(servico.criar(dados, ator)).rejects.toThrow(
      'Já existe um contrato para esta proposta.',
    );
  });

  it('não cria contrato se o imóvel não está livre', async () => {
    const { repositorio } = memoria('VENDIDO');
    const servico = servicoDe(repositorio);

    await expect(servico.criar(dados, ator)).rejects.toThrow(BadRequestException);
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('nasce em minuta', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);

    const criado = await servico.criar(dados, ator);

    expect(criado.situacao).toBe('MINUTA');
    expect(criado.codigo).toBe('CTR-0001');
    expect(imovel.situacao).toBe('RESERVADO');
  });

  it('ativar venda marca o imóvel como vendido', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);

    const vigente = await servico.ativar(criado.id, ator);

    expect(vigente.situacao).toBe('VIGENTE');
    expect(imovel.situacao).toBe('VENDIDO');
  });

  it('ativar aluguel marca o imóvel como alugado', async () => {
    const { imovel, propostas, repositorio } = memoria();
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, finalidade: 'ALUGUEL' });
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);

    await servico.ativar(criado.id, ator);

    expect(imovel.situacao).toBe('ALUGADO');
  });

  it('encerrar aluguel da proposta do contrato devolve o imóvel para disponível', async () => {
    const { imovel, propostas, repositorio } = memoria();
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, finalidade: 'ALUGUEL' });
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);

    const encerrado = await servico.encerrar(criado.id, ator);

    expect(encerrado.situacao).toBe('ENCERRADO');
    expect(imovel.situacao).toBe('DISPONIVEL');
  });

  it('encerrar aluguel preserva reserva de outra proposta aceita', async () => {
    const { imovel, propostas, repositorio } = memoria();
    const origem = propostas.get('proposta-1')!;
    propostas.set('proposta-1', { ...origem, finalidade: 'ALUGUEL' });
    propostas.set('proposta-2', { ...origem, id: 'proposta-2', finalidade: 'ALUGUEL' });
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);

    await servico.encerrar(criado.id, ator);

    expect(imovel.situacao).toBe('RESERVADO');
  });

  it('encerrar aluguel sem proposta aceita ou enviada devolve o imóvel para disponível', async () => {
    const { imovel, propostas, repositorio } = memoria();
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, finalidade: 'ALUGUEL' });
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, situacao: 'CANCELADA' });
    await servico.ativar(criado.id, ator);

    await servico.encerrar(criado.id, ator);

    expect(imovel.situacao).toBe('DISPONIVEL');
  });

  it('encerrar aluguel não libera o imóvel se ainda houver outro vigente', async () => {
    const { imovel, propostas, contratos, repositorio } = memoria();
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, finalidade: 'ALUGUEL' });
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);
    const outro = contratos[0];
    contratos.push({ ...outro, id: 'contrato-2', situacao: 'VIGENTE', propostaId: 'proposta-2' });

    await servico.encerrar(criado.id, ator);

    expect(imovel.situacao).toBe('ALUGADO');
  });

  it('encerrar venda não devolve o imóvel para disponível', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);

    await servico.encerrar(criado.id, ator);

    expect(imovel.situacao).toBe('VENDIDO');
  });

  it('cancelar vigente devolve o imóvel para reservado', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);

    const cancelado = await servico.cancelar(criado.id, 'Distrato', ator);

    expect(cancelado.situacao).toBe('CANCELADO');
    expect(imovel.situacao).toBe('RESERVADO');
  });

  it('cancelar vigente não mexe no imóvel se outro contrato seguir vigente', async () => {
    const { imovel, contratos, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);
    contratos.push({ ...contratos[0], id: 'contrato-2', situacao: 'VIGENTE', propostaId: 'proposta-2' });

    await servico.cancelar(criado.id, 'Distrato', ator);

    expect(imovel.situacao).toBe('VENDIDO');
  });

  it('cancelar vigente sem proposta aceita devolve o imóvel para disponível', async () => {
    const { imovel, propostas, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    propostas.set('proposta-1', { ...propostas.get('proposta-1')!, situacao: 'CANCELADA' });
    await servico.ativar(criado.id, ator);

    await servico.cancelar(criado.id, 'Distrato', ator);

    expect(imovel.situacao).toBe('DISPONIVEL');
  });

  it('não exclui contrato que saiu da minuta', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);
    await servico.ativar(criado.id, ator);

    await expect(servico.excluir(criado.id, ator)).rejects.toThrow('Só é possível excluir um contrato em minuta.');
  });

  it('cancelar minuta não altera a situação do imóvel', async () => {
    const { imovel, repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);

    await servico.cancelar(criado.id, 'Desistiu', ator);

    expect(imovel.situacao).toBe('RESERVADO');
  });

  it('não gera contrato de proposta que não foi aceita', async () => {
    const repositorio = {
      buscarPorProposta: vi.fn(async () => null),
      buscarPropostaCompleta: vi.fn(async () => ({ id: 'proposta-1', situacao: 'ENVIADA' })),
    };
    const servico = servicoDe(repositorio);

    await expect(
      servico.gerarDaProposta('proposta-1', { dataInicio: '2026-11-08', vencimento: '2027-11-08' }, ator),
    ).rejects.toThrow('Selecione uma proposta aceita.');
  });

  it('grava a vigência informada e não copia a validade da proposta', async () => {
    const endereco = {
      logradouro: 'Rua A',
      numero: '10',
      complemento: null,
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01001000',
    };
    const criados: Record<string, unknown>[] = [];
    const repositorio = {
      buscarPorProposta: vi.fn(async () => null),
      buscarPropostaCompleta: vi.fn(async () => ({
        id: 'proposta-1',
        situacao: 'ACEITA',
        imovelId: 'imovel-1',
        clienteId: 'cliente-1',
        finalidade: 'ALUGUEL',
        valor: 1500,
        formaPagamentoId: 'forma-1',
        formaPagamento: { nome: 'Pix' },
        condicoes: 'Sem pets',
        validade: '2026-11-10',
        entrada: null,
        parcelas: null,
        imovel: {
          codigo: 'AP-1',
          tipo: 'APARTAMENTO',
          area: 40,
          descricao: '',
          situacao: 'RESERVADO',
          proprietario: { nome: 'Ana', documentoCifrado: null, email: 'ana@example.com', telefone: '11999999999', ...endereco },
          ...endereco,
        },
        cliente: {
          id: 'cliente-1',
          nome: 'Bruno',
          documentoCifrado: null,
          email: 'bruno@example.com',
          telefone: '11988888888',
          ...endereco,
        },
      })),
      buscarModelo: vi.fn(async () => ({ id: 'modelo-1', conteudo: '<p>{{valor}}</p>' })),
      buscarImovel: vi.fn(async () => ({ id: 'imovel-1', situacao: 'RESERVADO' })),
      proximoCodigo: vi.fn(async () => 'CTR-0001'),
      criar: vi.fn(async (entrada: Record<string, unknown>) => {
        criados.push(entrada);
        return { id: 'contrato-1' };
      }),
      registrarHistorico: vi.fn(),
      buscarPorId: vi.fn(async () => ({
        id: 'contrato-1',
        codigo: 'CTR-0001',
        propostaId: 'proposta-1',
        imovelId: 'imovel-1',
        clienteId: 'cliente-1',
        finalidade: 'ALUGUEL',
        valor: 1500,
        situacao: 'MINUTA',
        dataInicio: '2026-11-08',
        vencimento: '2027-11-08',
        observacoes: 'Sem pets',
        motivo: null,
        conteudo: '<p>1.500,00</p>',
        documentos: [],
        historico: [],
        imovel: { codigo: 'AP-1', proprietarioId: null, proprietario: null },
        cliente: { nome: 'Bruno', email: 'bruno@example.com' },
        corretor: { name: 'Ana' },
        formaPagamento: { nome: 'Pix' },
        formaPagamentoId: 'forma-1',
        finalizadoEm: null,
        createdAt: new Date(),
      })),
    };
    const servico = servicoDe(repositorio);

    await servico.gerarDaProposta('proposta-1', { dataInicio: '2026-11-08', vencimento: '2027-11-08' }, ator);

    expect(criados[0]).toMatchObject({
      dataInicio: '2026-11-08',
      vencimento: '2027-11-08',
      situacao: 'MINUTA',
    });
  });
});

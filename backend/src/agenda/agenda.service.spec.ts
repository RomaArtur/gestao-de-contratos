import { AgendaService } from './agenda.service.js';
import type { DadosEvento } from './agenda.schema.js';

const ator = { usuarioId: 'user-1' };

const dados: DadosEvento = {
  titulo: 'Visita ao apartamento',
  tipo: 'VISITA',
  inicio: '2026-11-10T12:00:00.000Z',
  fim: '2026-11-10T13:00:00.000Z',
  descricao: '',
  imovelId: 'imovel-1',
  clienteId: '',
  contratoId: '',
};

function memoria() {
  const eventos: Array<Record<string, unknown> & { id: string; situacao: string; update: (dados: object) => Promise<unknown> }> = [];
  const repositorio = {
    listar: vi.fn(),
    buscarPorId: vi.fn(async (id: string) => eventos.find((item) => item.id === id) ?? null),
    criar: vi.fn(async (entrada: Record<string, unknown>) => {
      const registro = {
        id: 'evento-1',
        situacao: 'AGENDADO',
        ...entrada,
        imovel: entrada.imovelId ? { codigo: 'AP-1' } : undefined,
        cliente: undefined,
        contrato: undefined,
        update: vi.fn(async (alteracao: object) => {
          Object.assign(registro, alteracao);
          return registro;
        }),
      };
      eventos.push(registro);
      return registro;
    }),
    atualizar: vi.fn(async (evento: { update: (dados: object) => Promise<unknown> }, alteracao: object) =>
      evento.update(alteracao),
    ),
    buscarImovel: vi.fn(async (id: string) => (id === 'imovel-1' ? { id } : null)),
    buscarCliente: vi.fn(async () => null),
    buscarContrato: vi.fn(async () => null),
  };
  return { eventos, repositorio };
}

function servicoDe(repositorio: object) {
  return new AgendaService(repositorio as never, { record: vi.fn() } as never);
}

describe('AgendaService', () => {
  it('recusa um fim anterior ao início', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);

    await expect(
      servico.criar({ ...dados, fim: '2026-11-10T11:00:00.000Z' }, ator),
    ).rejects.toThrow('O fim precisa ser posterior ao início.');
    expect(repositorio.criar).not.toHaveBeenCalled();
  });

  it('grava o vínculo com o imóvel e nasce agendado', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);

    const criado = await servico.criar(dados, ator);

    expect(criado.situacao).toBe('AGENDADO');
    expect(criado.codigoImovel).toBe('AP-1');
    expect(criado.clienteId).toBeNull();
  });

  it('cancela um evento agendado e impede nova edição', async () => {
    const { repositorio } = memoria();
    const servico = servicoDe(repositorio);
    const criado = await servico.criar(dados, ator);

    const cancelado = await servico.cancelar(criado.id, ator);

    expect(cancelado.situacao).toBe('CANCELADO');
    await expect(servico.atualizar(criado.id, dados, ator)).rejects.toThrow('Este evento está cancelado.');
  });
});

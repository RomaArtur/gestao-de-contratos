import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditWriter } from '../audit/audit-entry.js';
import { registrarAuditoria } from '../audit/registrar.js';
import type { Ator } from '../comum/ator.js';
import { Evento } from '../database/entidades-agenda.js';
import { AgendaRepository } from './agenda.repository.js';
import type { DadosEvento } from './agenda.schema.js';

@Injectable()
export class AgendaService {
  constructor(
    private readonly agenda: AgendaRepository,
    private readonly audit: AuditWriter,
  ) {}

  async listar(inicio: string, fim: string) {
    const periodo = this.periodo(inicio, fim);
    const registros = await this.agenda.listar(periodo.inicio, periodo.fim);
    return registros.map((evento) => this.apresentar(evento));
  }

  async buscarPorId(id: string) {
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async criar(dados: DadosEvento, ator: Ator) {
    const evento = await this.agenda.criar({
      ...(await this.colunas(dados)),
      situacao: 'AGENDADO',
      usuarioId: ator.usuarioId,
    });
    await this.auditar(ator, 'EVENTO_CRIADO', evento.id, null, { titulo: dados.titulo, tipo: dados.tipo });
    return this.apresentar(await this.obterOuFalhar(evento.id));
  }

  async atualizar(id: string, dados: DadosEvento, ator: Ator) {
    const evento = await this.obterOuFalhar(id);
    this.exigirAberto(evento);
    await this.agenda.atualizar(evento, await this.colunas(dados));
    await this.auditar(ator, 'EVENTO_ATUALIZADO', id, null, { titulo: dados.titulo, tipo: dados.tipo });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async cancelar(id: string, ator: Ator) {
    const evento = await this.obterOuFalhar(id);
    this.exigirAberto(evento);
    await this.agenda.atualizar(evento, { situacao: 'CANCELADO' });
    await this.auditar(ator, 'EVENTO_CANCELADO', id, { situacao: 'AGENDADO' }, { situacao: 'CANCELADO' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  private periodo(inicio: string, fim: string) {
    const de = new Date(inicio);
    const ate = new Date(fim);
    if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime()) || ate <= de) {
      throw new BadRequestException('Informe um período válido.');
    }
    return { inicio: de, fim: ate };
  }

  private async colunas(dados: DadosEvento) {
    const inicio = new Date(dados.inicio);
    const fim = new Date(dados.fim);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime()) || fim <= inicio) {
      throw new BadRequestException('O fim precisa ser posterior ao início.');
    }
    return {
      titulo: dados.titulo,
      tipo: dados.tipo,
      inicio,
      fim,
      descricao: dados.descricao || null,
      imovelId: await this.vinculo(dados.imovelId, (id) => this.agenda.buscarImovel(id), 'Imóvel não encontrado.'),
      clienteId: await this.vinculo(dados.clienteId, (id) => this.agenda.buscarCliente(id), 'Cliente não encontrado.'),
      contratoId: await this.vinculo(
        dados.contratoId,
        (id) => this.agenda.buscarContrato(id),
        'Contrato não encontrado.',
      ),
    };
  }

  private async vinculo(
    id: string | undefined,
    buscar: (id: string) => Promise<{ id: string } | null>,
    mensagem: string,
  ) {
    if (!id) return null;
    const registro = await buscar(id);
    if (!registro) throw new BadRequestException(mensagem);
    return registro.id;
  }

  private exigirAberto(evento: Evento) {
    if (evento.situacao !== 'AGENDADO') {
      throw new BadRequestException('Este evento está cancelado.');
    }
  }

  private async obterOuFalhar(id: string) {
    const evento = await this.agenda.buscarPorId(id);
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    return evento;
  }

  private apresentar(evento: Evento) {
    return {
      id: evento.id,
      titulo: evento.titulo,
      tipo: evento.tipo,
      inicio: evento.inicio,
      fim: evento.fim,
      descricao: evento.descricao,
      situacao: evento.situacao,
      imovelId: evento.imovelId,
      codigoImovel: evento.imovel?.codigo ?? null,
      clienteId: evento.clienteId,
      nomeCliente: evento.cliente?.nome ?? null,
      contratoId: evento.contratoId,
      codigoContrato: evento.contrato?.codigo ?? null,
    };
  }

  private auditar(
    ator: Ator,
    action: string,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
  ) {
    return registrarAuditoria(this.audit, ator, action, 'Evento', entityId, oldValues, newValues);
  }
}

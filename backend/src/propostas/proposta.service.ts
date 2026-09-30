import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Transaction } from 'sequelize';
import { AuditWriter } from '../audit/audit-entry.js';
import type { Ator } from '../comum/ator.js';
import { Imovel } from '../database/entidades-catalogo.js';
import { Proposta } from '../database/entidades-proposta.js';
import { SEQUELIZE } from '../database/database.module.js';
import type { Sequelize } from 'sequelize';
import { PropostaRepository } from './proposta.repository.js';
import type { DadosProposta, ListarPropostasDto } from './proposta.schema.js';

const SITUACOES_IMOVEL_ABERTAS = new Set(['DISPONIVEL', 'EM_NEGOCIACAO', 'RESERVADO']);

@Injectable()
export class PropostaService {
  constructor(
    private readonly propostas: PropostaRepository,
    private readonly audit: AuditWriter,
    @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
  ) {}

  async listar(consulta: ListarPropostasDto) {
    const { rows, count } = await this.propostas.listar({
      busca: consulta.busca,
      situacao: consulta.situacao || undefined,
      imovelId: consulta.imovelId || undefined,
      clienteId: consulta.clienteId || undefined,
      pagina: consulta.pagina,
      tamanhoPagina: consulta.tamanhoPagina,
    });
    return {
      dados: rows.map((registro) => this.paraLista(registro)),
      pagina: consulta.pagina,
      tamanhoPagina: consulta.tamanhoPagina,
      total: count,
    };
  }

  async listarPorCliente(clienteId: string) {
    const registros = await this.propostas.listarPorCliente(clienteId);
    return registros.map((registro) => this.paraLista(registro));
  }

  async buscarPorId(id: string) {
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async criar(dados: DadosProposta, ator: Ator) {
    const imovel = await this.garantirImovel(dados.imovelId);
    await this.garantirCliente(dados.clienteId);
    this.garantirFinalidade(imovel, dados.finalidade);
    const proposta = await this.sequelize.transaction(async (transaction) => {
      const criada = await this.propostas.criar(
        {
          imovelId: dados.imovelId,
          clienteId: dados.clienteId,
          corretorId: ator.usuarioId,
          finalidade: dados.finalidade,
          valor: dados.valor,
          condicoes: dados.condicoes || null,
          validade: dados.validade || null,
          situacao: 'RASCUNHO',
          motivo: null,
        },
        transaction,
      );
      await this.propostas.registrarHistorico(
        {
          propostaId: criada.id,
          situacaoAnterior: null,
          situacaoNova: 'RASCUNHO',
          observacao: 'Proposta criada.',
          usuarioId: ator.usuarioId,
        },
        transaction,
      );
      return criada;
    });
    await this.auditar(ator, 'PROPOSTA_CRIADA', proposta.id, null, { situacao: 'RASCUNHO' });
    return this.apresentar(await this.obterOuFalhar(proposta.id));
  }

  async atualizar(id: string, dados: DadosProposta, ator: Ator) {
    const proposta = await this.obterOuFalhar(id);
    this.exigirSituacao(proposta, ['RASCUNHO'], 'Só é possível editar uma proposta em rascunho.');
    const imovel = await this.garantirImovel(dados.imovelId);
    await this.garantirCliente(dados.clienteId);
    this.garantirFinalidade(imovel, dados.finalidade);
    await this.propostas.atualizar(proposta, {
      imovelId: dados.imovelId,
      clienteId: dados.clienteId,
      finalidade: dados.finalidade,
      valor: dados.valor,
      condicoes: dados.condicoes || null,
      validade: dados.validade || null,
    });
    await this.auditar(ator, 'PROPOSTA_ATUALIZADA', id, null, { valor: dados.valor });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async excluir(id: string, ator: Ator) {
    const proposta = await this.obterOuFalhar(id);
    this.exigirSituacao(proposta, ['RASCUNHO'], 'Só é possível excluir uma proposta em rascunho.');
    await this.propostas.excluir(proposta);
    await this.auditar(ator, 'PROPOSTA_EXCLUIDA', id, { situacao: 'RASCUNHO' }, null);
  }

  async enviar(id: string, ator: Ator) {
    const proposta = await this.obterOuFalhar(id);
    this.exigirSituacao(proposta, ['RASCUNHO'], 'Só é possível enviar uma proposta em rascunho.');
    this.garantirValidade(proposta.validade);
    const imovel = await this.garantirImovel(proposta.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(proposta, 'ENVIADA', null, 'Proposta enviada.', ator, transaction);
      if (imovel.situacao === 'DISPONIVEL') {
        await this.propostas.atualizarSituacaoImovel(imovel, 'EM_NEGOCIACAO', transaction);
      }
    });
    await this.auditar(ator, 'PROPOSTA_ENVIADA', id, { situacao: 'RASCUNHO' }, { situacao: 'ENVIADA' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async aceitar(id: string, ator: Ator) {
    const proposta = await this.obterOuFalhar(id);
    this.exigirSituacao(proposta, ['ENVIADA'], 'Só é possível aceitar uma proposta enviada.');
    const imovel = await this.garantirImovel(proposta.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(proposta, 'ACEITA', null, 'Proposta aceita.', ator, transaction);
      await this.propostas.recusarOutrasEnviadas(
        proposta.imovelId,
        proposta.finalidade,
        proposta.id,
        ator.usuarioId,
        transaction,
      );
      if (imovel.situacao !== 'VENDIDO' && imovel.situacao !== 'ALUGADO') {
        await this.propostas.atualizarSituacaoImovel(imovel, 'RESERVADO', transaction);
      }
    });
    await this.auditar(ator, 'PROPOSTA_ACEITA', id, { situacao: 'ENVIADA' }, { situacao: 'ACEITA' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async recusar(id: string, motivo: string, ator: Ator) {
    return this.encerrar(id, 'RECUSADA', motivo, 'ENVIADA', ator, 'PROPOSTA_RECUSADA');
  }

  async cancelar(id: string, motivo: string, ator: Ator) {
    const proposta = await this.obterOuFalhar(id);
    if (proposta.situacao !== 'RASCUNHO' && proposta.situacao !== 'ENVIADA') {
      throw new BadRequestException('Só é possível cancelar uma proposta em rascunho ou enviada.');
    }
    const anterior = proposta.situacao;
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(proposta, 'CANCELADA', motivo, motivo, ator, transaction);
      if (anterior === 'ENVIADA') await this.liberarImovel(proposta.imovelId, transaction);
    });
    await this.auditar(ator, 'PROPOSTA_CANCELADA', id, { situacao: anterior }, { situacao: 'CANCELADA' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  private async encerrar(
    id: string,
    situacao: 'RECUSADA',
    motivo: string,
    esperada: 'ENVIADA',
    ator: Ator,
    acao: string,
  ) {
    const proposta = await this.obterOuFalhar(id);
    this.exigirSituacao(proposta, [esperada], 'Só é possível recusar uma proposta enviada.');
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(proposta, situacao, motivo, motivo, ator, transaction);
      await this.liberarImovel(proposta.imovelId, transaction);
    });
    await this.auditar(ator, acao, id, { situacao: esperada }, { situacao });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  private async liberarImovel(imovelId: string, transaction: Transaction) {
    const imovel = await this.propostas.buscarImovel(imovelId);
    if (!imovel) return;
    const ativas = await this.propostas.contarAtivas(imovelId, transaction);
    if (ativas > 0) return;
    if (imovel.situacao === 'EM_NEGOCIACAO' || imovel.situacao === 'RESERVADO') {
      await this.propostas.atualizarSituacaoImovel(imovel, 'DISPONIVEL', transaction);
    }
  }

  private async mudarSituacao(
    proposta: Proposta,
    situacao: Proposta['situacao'],
    motivo: string | null,
    observacao: string,
    ator: Ator,
    transaction: Transaction,
  ) {
    const anterior = proposta.situacao;
    await this.propostas.atualizar(proposta, { situacao, motivo }, transaction);
    await this.propostas.registrarHistorico(
      {
        propostaId: proposta.id,
        situacaoAnterior: anterior,
        situacaoNova: situacao,
        observacao,
        usuarioId: ator.usuarioId,
      },
      transaction,
    );
  }

  private async garantirImovel(id: string) {
    const imovel = await this.propostas.buscarImovel(id);
    if (!imovel) throw new BadRequestException('Imóvel não encontrado.');
    if (!SITUACOES_IMOVEL_ABERTAS.has(imovel.situacao)) {
      throw new BadRequestException('Este imóvel não está disponível para proposta.');
    }
    return imovel;
  }

  private async garantirCliente(id: string) {
    const cliente = await this.propostas.buscarCliente(id);
    if (!cliente) throw new BadRequestException('Cliente não encontrado.');
  }

  private garantirFinalidade(imovel: Imovel, finalidade: string) {
    if (imovel.finalidade !== 'VENDA_ALUGUEL' && imovel.finalidade !== finalidade) {
      throw new BadRequestException('A finalidade da proposta não corresponde à do imóvel.');
    }
  }

  private garantirValidade(validade: string | null) {
    if (!validade) return;
    const hoje = new Date().toISOString().slice(0, 10);
    if (validade < hoje) {
      throw new BadRequestException('A validade da proposta já passou.');
    }
  }

  private exigirSituacao(proposta: Proposta, permitidas: string[], mensagem: string) {
    if (!permitidas.includes(proposta.situacao)) {
      throw new BadRequestException(mensagem);
    }
  }

  private async obterOuFalhar(id: string) {
    const proposta = await this.propostas.buscarPorId(id);
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    return proposta;
  }

  private apresentar(proposta: Proposta) {
    const historico = [...(proposta.historico ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return {
      ...this.paraLista(proposta),
      condicoes: proposta.condicoes,
      motivo: proposta.motivo,
      historico: historico.map((item) => ({
        id: item.id,
        situacaoAnterior: item.situacaoAnterior,
        situacaoNova: item.situacaoNova,
        observacao: item.observacao,
        criadoEm: item.createdAt,
        usuario: item.usuario?.name ?? null,
      })),
    };
  }

  private paraLista(proposta: Proposta) {
    return {
      id: proposta.id,
      imovelId: proposta.imovelId,
      codigoImovel: proposta.imovel?.codigo ?? null,
      clienteId: proposta.clienteId,
      nomeCliente: proposta.cliente?.nome ?? null,
      finalidade: proposta.finalidade,
      valor: Number(proposta.valor),
      validade: proposta.validade,
      situacao: proposta.situacao,
      corretor: proposta.corretor?.name ?? null,
      criadoEm: proposta.createdAt,
    };
  }

  private auditar(
    ator: Ator,
    action: string,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    newValues: Record<string, unknown> | null,
  ) {
    return this.audit.record({
      userId: ator.usuarioId,
      action,
      entity: 'Proposta',
      entityId,
      oldValues,
      newValues,
      ip: ator.ip ?? null,
      userAgent: ator.userAgent ?? null,
    });
  }
}

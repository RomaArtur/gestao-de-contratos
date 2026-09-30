import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Sequelize, Transaction } from 'sequelize';
import { AuditWriter } from '../audit/audit-entry.js';
import { ArquivoAdapter } from '../arquivos/arquivo.adapter.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import type { Ator } from '../comum/ator.js';
import { Imovel } from '../database/entidades-catalogo.js';
import { Contrato } from '../database/entidades-contrato.js';
import { SEQUELIZE } from '../database/database.module.js';
import { ContratoRepository } from './contrato.repository.js';
import type {
  CategoriaDocumentoContratoDto,
  DadosAtualizacaoContrato,
  DadosContrato,
  ListarContratosDto,
} from './contrato.schema.js';

const SITUACOES_IMOVEL_LIVRES = new Set(['DISPONIVEL', 'EM_NEGOCIACAO', 'RESERVADO']);

@Injectable()
export class ContratoService {
  constructor(
    private readonly contratos: ContratoRepository,
    private readonly arquivos: ArquivoAdapter,
    private readonly audit: AuditWriter,
    @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
  ) {}

  async listar(consulta: ListarContratosDto) {
    const { rows, count } = await this.contratos.listar({
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
    const registros = await this.contratos.listarPorCliente(clienteId);
    return registros.map((registro) => this.paraLista(registro));
  }

  async buscarPorId(id: string) {
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async criar(dados: DadosContrato, ator: Ator) {
    const proposta = await this.contratos.buscarProposta(dados.propostaId);
    if (!proposta || proposta.situacao !== 'ACEITA') {
      throw new BadRequestException('Selecione uma proposta aceita.');
    }
    const existente = await this.contratos.buscarPorProposta(proposta.id);
    if (existente) {
      throw new BadRequestException('Já existe um contrato para esta proposta.');
    }
    const imovel = await this.garantirImovelLivre(proposta.imovelId);
    try {
      const contrato = await this.sequelize.transaction(async (transaction) => {
        const criado = await this.contratos.criar(
          {
            codigo: await this.contratos.proximoCodigo(transaction),
            propostaId: proposta.id,
            imovelId: proposta.imovelId,
            clienteId: proposta.clienteId,
            corretorId: ator.usuarioId,
            finalidade: proposta.finalidade,
            valor: proposta.valor,
            dataInicio: dados.dataInicio,
            vencimento: dados.vencimento,
            situacao: 'MINUTA',
            observacoes: dados.observacoes || null,
            motivo: null,
          },
          transaction,
        );
        await this.contratos.registrarHistorico(
          {
            contratoId: criado.id,
            situacaoAnterior: null,
            situacaoNova: 'MINUTA',
            observacao: 'Contrato gerado a partir da proposta aceita.',
            usuarioId: ator.usuarioId,
          },
          transaction,
        );
        return criado;
      });
      await this.auditar(ator, 'CONTRATO_CRIADO', contrato.id, null, {
        codigo: contrato.codigo,
        propostaId: proposta.id,
        imovelId: imovel.id,
      });
      return this.apresentar(await this.obterOuFalhar(contrato.id));
    } catch (error) {
      rethrowConstraint(error, 'Já existe um contrato para esta proposta.');
    }
  }

  async atualizar(id: string, dados: DadosAtualizacaoContrato, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível editar um contrato em minuta.');
    await this.contratos.atualizar(contrato, {
      dataInicio: dados.dataInicio,
      vencimento: dados.vencimento,
      observacoes: dados.observacoes || null,
    });
    await this.auditar(ator, 'CONTRATO_ATUALIZADO', id, null, { vencimento: dados.vencimento });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async excluir(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível excluir um contrato em minuta.');
    const arquivos = (contrato.documentos ?? []).map((documento) => documento.chaveArquivo);
    await this.contratos.excluir(contrato);
    await Promise.all(arquivos.map((chave) => this.arquivos.remover(chave)));
    await this.auditar(ator, 'CONTRATO_EXCLUIDO', id, { situacao: 'MINUTA', codigo: contrato.codigo }, null);
  }

  async ativar(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível ativar um contrato em minuta.');
    const imovel = await this.garantirImovelLivre(contrato.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(contrato, 'VIGENTE', null, 'Contrato ativado.', ator, transaction);
      await this.contratos.atualizarSituacaoImovel(
        imovel,
        contrato.finalidade === 'ALUGUEL' ? 'ALUGADO' : 'VENDIDO',
        transaction,
      );
    });
    await this.auditar(ator, 'CONTRATO_ATIVADO', id, { situacao: 'MINUTA' }, { situacao: 'VIGENTE' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async encerrar(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['VIGENTE'], 'Só é possível encerrar um contrato vigente.');
    const imovel = await this.contratos.buscarImovel(contrato.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(contrato, 'ENCERRADO', null, 'Contrato encerrado.', ator, transaction);
      if (imovel && contrato.finalidade === 'ALUGUEL') {
        await this.liberarAluguel(imovel, contrato.id, transaction);
      }
    });
    await this.auditar(ator, 'CONTRATO_ENCERRADO', id, { situacao: 'VIGENTE' }, { situacao: 'ENCERRADO' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async cancelar(id: string, motivo: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    if (contrato.situacao !== 'MINUTA' && contrato.situacao !== 'VIGENTE') {
      throw new BadRequestException('Só é possível cancelar um contrato em minuta ou vigente.');
    }
    const anterior = contrato.situacao;
    const imovel = await this.contratos.buscarImovel(contrato.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(contrato, 'CANCELADO', motivo, motivo, ator, transaction);
      if (anterior === 'VIGENTE' && imovel) {
        await this.devolverReserva(imovel, contrato.id, transaction);
      }
    });
    await this.auditar(ator, 'CONTRATO_CANCELADO', id, { situacao: anterior }, { situacao: 'CANCELADO' });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async adicionarDocumento(
    id: string,
    arquivo: { filename: string; originalname: string },
    dados: CategoriaDocumentoContratoDto,
    ator: Ator,
  ) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirAberto(contrato);
    const quantidade = await this.contratos.contarDocumentos(id);
    if (quantidade >= 20) {
      await this.arquivos.remover(arquivo.filename);
      throw new BadRequestException('O contrato já tem 20 documentos.');
    }
    try {
      const documento = await this.contratos.criarDocumento({
        contratoId: id,
        categoria: dados.categoria,
        chaveArquivo: arquivo.filename,
        nomeOriginal: arquivo.originalname,
      });
      await this.auditar(ator, 'DOCUMENTO_CONTRATO_ADICIONADO', id, null, {
        documentoId: documento.id,
        categoria: documento.categoria,
      });
      return this.documentoDe(documento);
    } catch (error) {
      await this.arquivos.remover(arquivo.filename);
      throw error;
    }
  }

  async removerDocumento(id: string, documentoId: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirAberto(contrato);
    const documento = await this.contratos.buscarDocumento(id, documentoId);
    if (!documento) throw new NotFoundException('Documento não encontrado.');
    await documento.destroy();
    await this.arquivos.remover(documento.chaveArquivo);
    await this.auditar(ator, 'DOCUMENTO_CONTRATO_REMOVIDO', id, {
      documentoId,
      categoria: documento.categoria,
    }, null);
  }

  private async liberarAluguel(imovel: Imovel, contratoId: string, transaction: Transaction) {
    const vigentes = await this.contratos.contarVigentes(imovel.id, contratoId, transaction);
    if (vigentes > 0) return;
    if (imovel.situacao === 'ALUGADO') {
      await this.contratos.atualizarSituacaoImovel(imovel, 'DISPONIVEL', transaction);
    }
  }

  private async devolverReserva(imovel: Imovel, contratoId: string, transaction: Transaction) {
    const vigentes = await this.contratos.contarVigentes(imovel.id, contratoId, transaction);
    if (vigentes > 0) return;
    if (imovel.situacao === 'VENDIDO' || imovel.situacao === 'ALUGADO') {
      await this.contratos.atualizarSituacaoImovel(imovel, 'RESERVADO', transaction);
    }
  }

  private async mudarSituacao(
    contrato: Contrato,
    situacao: Contrato['situacao'],
    motivo: string | null,
    observacao: string,
    ator: Ator,
    transaction: Transaction,
  ) {
    const anterior = contrato.situacao;
    await this.contratos.atualizar(contrato, { situacao, motivo }, transaction);
    await this.contratos.registrarHistorico(
      {
        contratoId: contrato.id,
        situacaoAnterior: anterior,
        situacaoNova: situacao,
        observacao,
        usuarioId: ator.usuarioId,
      },
      transaction,
    );
  }

  private async garantirImovelLivre(id: string) {
    const imovel = await this.contratos.buscarImovel(id);
    if (!imovel) throw new BadRequestException('Imóvel não encontrado.');
    if (!SITUACOES_IMOVEL_LIVRES.has(imovel.situacao)) {
      throw new BadRequestException('Este imóvel não está disponível para contrato.');
    }
    return imovel;
  }

  private exigirSituacao(contrato: Contrato, permitidas: string[], mensagem: string) {
    if (!permitidas.includes(contrato.situacao)) {
      throw new BadRequestException(mensagem);
    }
  }

  private exigirAberto(contrato: Contrato) {
    if (contrato.situacao !== 'MINUTA' && contrato.situacao !== 'VIGENTE') {
      throw new BadRequestException('Não é possível alterar documentos deste contrato.');
    }
  }

  private async obterOuFalhar(id: string) {
    const contrato = await this.contratos.buscarPorId(id);
    if (!contrato) throw new NotFoundException('Contrato não encontrado.');
    return contrato;
  }

  private apresentar(contrato: Contrato) {
    const historico = [...(contrato.historico ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    const documentos = [...(contrato.documentos ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
    return {
      ...this.paraLista(contrato),
      observacoes: contrato.observacoes,
      motivo: contrato.motivo,
      documentos: documentos.map((documento) => this.documentoDe(documento)),
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

  private paraLista(contrato: Contrato) {
    return {
      id: contrato.id,
      codigo: contrato.codigo,
      propostaId: contrato.propostaId,
      imovelId: contrato.imovelId,
      codigoImovel: contrato.imovel?.codigo ?? null,
      clienteId: contrato.clienteId,
      nomeCliente: contrato.cliente?.nome ?? null,
      finalidade: contrato.finalidade,
      valor: Number(contrato.valor),
      dataInicio: contrato.dataInicio,
      vencimento: contrato.vencimento,
      situacao: contrato.situacao,
      corretor: contrato.corretor?.name ?? null,
      criadoEm: contrato.createdAt,
    };
  }

  private documentoDe(documento: { id: string; chaveArquivo: string; nomeOriginal: string; categoria: string }) {
    return {
      id: documento.id,
      url: `/api/v1/arquivos/${documento.chaveArquivo}`,
      nomeOriginal: documento.nomeOriginal,
      categoria: documento.categoria,
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
      entity: 'Contrato',
      entityId,
      oldValues,
      newValues,
      ip: ator.ip ?? null,
      userAgent: ator.userAgent ?? null,
    });
  }
}

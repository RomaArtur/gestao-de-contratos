import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type { Sequelize, Transaction } from 'sequelize';
import { AuditWriter } from '../audit/audit-entry.js';
import { registrarAuditoria } from '../audit/registrar.js';
import { ArquivoAdapter } from '../arquivos/arquivo.adapter.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import type { Ator } from '../comum/ator.js';
import { FieldCipher } from '../common/crypto/crypto.module.js';
import { Cliente } from '../database/entidades-catalogo.js';
import { Contrato } from '../database/entidades-contrato.js';
import { Evento } from '../database/entidades-agenda.js';
import { SEQUELIZE } from '../database/database.module.js';
import { FormaPagamentoService } from '../formas-pagamento/forma-pagamento.service.js';
import { montarValores, pendenciasObrigatorias } from './dados-contrato.js';
import { preencherModelo } from './modelos-texto.js';
import { sanearHtml, textoVisivel } from './sanear-html.js';
import { SITUACOES_IMOVEL_ABERTAS, SituacaoImovel } from '../imoveis/situacao-imovel.js';
import { EmailService } from '../email/email.service.js';
import { ContratoRepository } from './contrato.repository.js';
import type {
  CategoriaDocumentoContratoDto,
  DadosAtualizacaoContrato,
  DadosContrato,
  DadosGeracaoContrato,
  ListarContratosDto,
} from './contrato.schema.js';

@Injectable()
export class ContratoService {
  private readonly logger = new Logger(ContratoService.name);

  constructor(
    private readonly contratos: ContratoRepository,
    private readonly arquivos: ArquivoAdapter,
    private readonly audit: AuditWriter,
    private readonly situacaoImovel: SituacaoImovel,
    @Inject(SEQUELIZE) private readonly sequelize: Sequelize,
    private readonly formas: FormaPagamentoService,
    private readonly cifra: FieldCipher,
    private readonly email: EmailService,
  ) {}

  async listar(consulta: ListarContratosDto) {
    const { rows, count } = await this.contratos.listar({
      busca: consulta.busca,
      situacao: consulta.situacao || undefined,
      imovelId: consulta.imovelId || undefined,
      clienteId: consulta.clienteId || undefined,
      recorte: consulta.recorte || undefined,
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
    if (dados.propostaId) return this.criarDeProposta(dados, ator);
    return this.criarDireto(dados, ator);
  }

  private async criarDeProposta(dados: DadosContrato, ator: Ator) {
    const proposta = await this.contratos.buscarProposta(dados.propostaId!);
    if (!proposta || proposta.situacao !== 'ACEITA') {
      throw new BadRequestException('Selecione uma proposta aceita.');
    }
    const existente = await this.contratos.buscarPorProposta(proposta.id);
    if (existente) {
      throw new BadRequestException('Já existe um contrato para esta proposta.');
    }
    const imovel = await this.garantirImovelLivre(proposta.imovelId);
    const formaPagamentoId = await this.formaId(dados.formaPagamentoId || proposta.formaPagamentoId);
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
            valor: dados.valor ?? Number(proposta.valor),
            formaPagamentoId,
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

  private async criarDireto(dados: DadosContrato, ator: Ator) {
    if (!dados.imovelId || !dados.clienteId || !dados.finalidade || dados.valor == null) {
      throw new BadRequestException('Informe imóvel, cliente, finalidade e valor.');
    }
    const imovel = await this.garantirImovelLivre(dados.imovelId);
    await this.garantirCliente(dados.clienteId);
    this.garantirFinalidade(imovel, dados.finalidade);
    const formaPagamentoId = await this.formaId(dados.formaPagamentoId);
    const contrato = await this.sequelize.transaction(async (transaction) => {
      const criado = await this.contratos.criar(
        {
          codigo: await this.contratos.proximoCodigo(transaction),
          propostaId: null,
          imovelId: imovel.id,
          clienteId: dados.clienteId,
          corretorId: ator.usuarioId,
          finalidade: dados.finalidade,
          valor: dados.valor,
          formaPagamentoId,
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
          observacao: 'Contrato cadastrado.',
          usuarioId: ator.usuarioId,
        },
        transaction,
      );
      return criado;
    });
    await this.auditar(ator, 'CONTRATO_CRIADO', contrato.id, null, {
      codigo: contrato.codigo,
      imovelId: imovel.id,
      clienteId: dados.clienteId,
    });
    return this.apresentar(await this.obterOuFalhar(contrato.id));
  }

  async atualizar(id: string, dados: DadosAtualizacaoContrato, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível editar um contrato em minuta.');
    const alteracao: Record<string, unknown> = {
      dataInicio: dados.dataInicio,
      vencimento: dados.vencimento,
      observacoes: dados.observacoes || null,
    };
    if (dados.formaPagamentoId !== undefined) {
      alteracao.formaPagamentoId = await this.formaId(dados.formaPagamentoId, contrato.formaPagamentoId);
    }
    if (dados.valor != null) alteracao.valor = dados.valor;
    if (!contrato.propostaId) {
      const imovelId = dados.imovelId || contrato.imovelId;
      const clienteId = dados.clienteId || contrato.clienteId;
      const finalidade = dados.finalidade || contrato.finalidade;
      if (imovelId !== contrato.imovelId) await this.garantirImovelLivre(imovelId);
      const imovel = await this.contratos.buscarImovel(imovelId);
      if (!imovel) throw new BadRequestException('Imóvel não encontrado.');
      await this.garantirCliente(clienteId);
      this.garantirFinalidade(imovel, finalidade);
      alteracao.imovelId = imovelId;
      alteracao.clienteId = clienteId;
      alteracao.finalidade = finalidade;
    }
    await this.contratos.atualizar(contrato, alteracao);
    await this.auditar(ator, 'CONTRATO_ATUALIZADO', id, null, { vencimento: dados.vencimento });
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async gerarDaProposta(propostaId: string, dados: DadosGeracaoContrato, ator: Ator) {
    const existente = await this.contratos.buscarPorProposta(propostaId);
    if (existente) return this.buscarPorId(existente.id);

    const proposta = await this.contratos.buscarPropostaCompleta(propostaId);
    if (!proposta) throw new NotFoundException('Proposta não encontrada.');
    if (proposta.situacao !== 'ACEITA') {
      throw new BadRequestException('Selecione uma proposta aceita.');
    }
    if (!proposta.formaPagamentoId || !proposta.formaPagamento) {
      throw new BadRequestException('Selecione a forma de pagamento na proposta antes de gerar o contrato.');
    }
    const modelo = await this.contratos.buscarModelo(proposta.formaPagamentoId);
    if (!modelo) {
      throw new BadRequestException(
        `Não há modelo de contrato para ${proposta.formaPagamento.nome}. A geração foi interrompida para não criar um contrato incorreto.`,
      );
    }
    const valores = montarValores(proposta, (cifrado) => this.decifrar(cifrado));
    const faltantes = pendenciasObrigatorias(valores);
    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Não foi possível gerar o contrato. Complete na proposta ou no cadastro: ${faltantes.join(', ')}.`,
      );
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
            valor: Number(proposta.valor),
            formaPagamentoId: proposta.formaPagamentoId,
            modeloId: modelo.id,
            conteudo: preencherModelo(modelo.conteudo, valores),
            dataInicio: dados.dataInicio,
            vencimento: dados.vencimento,
            situacao: 'MINUTA',
            observacoes: proposta.condicoes,
            motivo: null,
          },
          transaction,
        );
        await this.contratos.registrarHistorico(
          {
            contratoId: criado.id,
            situacaoAnterior: null,
            situacaoNova: 'MINUTA',
            observacao: `Contrato gerado com o modelo de ${proposta.formaPagamento?.nome}.`,
            usuarioId: ator.usuarioId,
          },
          transaction,
        );
        return criado;
      });
      await this.auditar(ator, 'CONTRATO_GERADO', contrato.id, null, {
        propostaId: proposta.id,
        imovelId: imovel.id,
        formaPagamentoId: proposta.formaPagamentoId,
      });
      return this.buscarPorId(contrato.id);
    } catch (error) {
      rethrowConstraint(error, 'Já existe um contrato para esta proposta.');
    }
  }

  async salvarDocumento(
    id: string,
    conteudo: string,
    edicaoExplicita: boolean | undefined,
    ator: Ator,
  ) {
    const contrato = await this.obterOuFalhar(id);
    if (!contrato.conteudo) {
      throw new BadRequestException('Este contrato não possui documento editável.');
    }
    if (contrato.situacao !== 'MINUTA' && !edicaoExplicita) {
      throw new BadRequestException('Contrato finalizado. Use a ação de edição para alterá-lo.');
    }
    if (contrato.situacao === 'CANCELADO' || contrato.situacao === 'ENCERRADO') {
      throw new BadRequestException('Não é possível alterar um contrato encerrado ou cancelado.');
    }
    const limpo = sanearHtml(conteudo);
    if (!textoVisivel(limpo)) {
      throw new BadRequestException('O contrato está vazio.');
    }
    await this.contratos.atualizar(contrato, { conteudo: limpo });
    await this.auditar(ator, 'CONTRATO_DOCUMENTO_SALVO', id, null, { caracteres: limpo.length });
    return this.buscarPorId(id);
  }

  async finalizar(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    if (!textoVisivel(contrato.conteudo ?? '')) {
      throw new BadRequestException('Salve o documento do contrato antes de finalizar.');
    }
    const apresentado = await this.ativar(id, ator);
    await Contrato.update({ finalizadoEm: new Date() }, { where: { id } });
    const atualizado = await this.obterOuFalhar(id);
    const envio = await this.enviarAoContato(atualizado);
    return { ...apresentado, finalizadoEm: new Date(), ...envio };
  }

  async reenviar(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    if (contrato.situacao === 'MINUTA' || !contrato.conteudo) {
      throw new BadRequestException('Finalize o contrato antes de reenviar.');
    }
    const cliente = await Cliente.findByPk(contrato.clienteId);
    if (!cliente?.email) {
      throw new BadRequestException('O contato vinculado não tem e-mail cadastrado.');
    }
    await this.disparar(contrato, cliente.email);
    await this.contratos.registrarReenvio({
      contratoId: contrato.id,
      clienteId: cliente.id,
      email: cliente.email,
      usuarioId: ator.usuarioId,
    });
    await this.auditar(ator, 'CONTRATO_REENVIADO', id, null, { email: cliente.email });
    return { email: cliente.email, emailEnviado: true };
  }

  private async enviarAoContato(contrato: Contrato) {
    const cliente = await Cliente.findByPk(contrato.clienteId);
    if (!cliente?.email || !contrato.conteudo) {
      return { emailEnviado: false, emailDestino: cliente?.email ?? null };
    }
    try {
      await this.disparar(contrato, cliente.email);
      return { emailEnviado: true, emailDestino: cliente.email };
    } catch (erro) {
      this.logger.error(`Contrato ${contrato.codigo} finalizado sem e-mail: ${String(erro)}`);
      return { emailEnviado: false, emailDestino: cliente.email };
    }
  }

  private disparar(contrato: Contrato, para: string) {
    return this.email.enviar({
      para,
      assunto: `Contrato ${contrato.codigo}`,
      html: contrato.conteudo ?? '',
      texto: textoVisivel(contrato.conteudo ?? ''),
    });
  }

  async excluir(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível excluir um contrato em minuta.');
    const vinculados = await Evento.count({ where: { contratoId: id } });
    if (vinculados > 0) {
      throw new BadRequestException(
        'Este contrato está vinculado a eventos da agenda. Desvincule os eventos antes de excluir.',
      );
    }
    const arquivos = (contrato.documentos ?? []).map((documento) => documento.chaveArquivo);
    const situacao = contrato.situacao;
    await this.contratos.excluir(contrato);
    await Promise.all(arquivos.map((chave) => this.arquivos.remover(chave)));
    await this.auditar(ator, 'CONTRATO_EXCLUIDO', id, { situacao, codigo: contrato.codigo }, null);
  }

  async ativar(id: string, ator: Ator) {
    const contrato = await this.obterOuFalhar(id);
    this.exigirSituacao(contrato, ['MINUTA'], 'Só é possível ativar um contrato em minuta.');
    const imovel = await this.garantirImovelLivre(contrato.imovelId);
    await this.sequelize.transaction(async (transaction) => {
      await this.mudarSituacao(contrato, 'VIGENTE', null, 'Contrato ativado.', ator, transaction);
      await this.situacaoImovel.ocuparPorContrato(imovel, contrato.finalidade, transaction);
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
        await this.situacaoImovel.reconciliarOcupacao(
          imovel,
          await this.contasDoImovel(imovel.id, contrato.id, transaction, contrato.propostaId),
          transaction,
        );
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
        await this.situacaoImovel.reconciliarOcupacao(
          imovel,
          await this.contasDoImovel(imovel.id, contrato.id, transaction),
          transaction,
        );
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

  private async contasDoImovel(
    imovelId: string,
    contratoId: string,
    transaction: Transaction,
    propostaEncerradaId?: string | null,
  ) {
    const [vigentes, aceitas, enviadas] = await Promise.all([
      this.contratos.contarVigentes(imovelId, contratoId, transaction),
      this.contratos.contarPropostas(imovelId, ['ACEITA'], transaction, propostaEncerradaId),
      this.contratos.contarPropostas(imovelId, ['ENVIADA'], transaction),
    ]);
    return { vigentes, aceitas, enviadas };
  }

  private async garantirImovelLivre(id: string) {
    const imovel = await this.contratos.buscarImovel(id);
    if (!imovel) throw new BadRequestException('Imóvel não encontrado.');
    if (!SITUACOES_IMOVEL_ABERTAS.has(imovel.situacao)) {
      throw new BadRequestException('Este imóvel não está disponível para contrato.');
    }
    return imovel;
  }

  private async formaId(valor?: string | null, atual?: string | null) {
    if (!valor) return null;
    return this.formas.garantirUtilizavel(valor, valor === atual);
  }

  private async garantirCliente(id: string) {
    const cliente = await this.contratos.buscarCliente(id);
    if (!cliente) throw new BadRequestException('Cliente não encontrado.');
  }

  private garantirFinalidade(imovel: { finalidade: string }, finalidade: string) {
    if (imovel.finalidade !== 'VENDA_ALUGUEL' && imovel.finalidade !== finalidade) {
      throw new BadRequestException('A finalidade do contrato não corresponde à do imóvel.');
    }
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
      conteudo: contrato.conteudo,
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
      proprietarioId: contrato.imovel?.proprietarioId ?? null,
      nomeProprietario: contrato.imovel?.proprietario?.nome ?? null,
      clienteId: contrato.clienteId,
      nomeCliente: contrato.cliente?.nome ?? null,
      clienteTemEmail: Boolean(contrato.cliente?.email),
      finalidade: contrato.finalidade,
      valor: Number(contrato.valor),
      formaPagamentoId: contrato.formaPagamentoId,
      formaPagamento: contrato.formaPagamento?.nome ?? null,
      dataInicio: contrato.dataInicio,
      vencimento: contrato.vencimento,
      situacao: contrato.situacao,
      contatoId: contrato.clienteId,
      finalizadoEm: contrato.finalizadoEm,
      temDocumento: Boolean(contrato.conteudo),
      corretor: contrato.corretor?.name ?? null,
      criadoEm: contrato.createdAt,
    };
  }

  private decifrar(cifrado: string) {
    try {
      return this.cifra.decrypt(cifrado);
    } catch {
      return null;
    }
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
    return registrarAuditoria(this.audit, ator, action, 'Contrato', entityId, oldValues, newValues);
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditWriter } from '../audit/audit-entry.js';
import { ArquivoAdapter } from '../arquivos/arquivo.adapter.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import type { Ator } from '../comum/ator.js';
import { colunasEndereco, enderecoDe } from '../comum/endereco.js';
import {
  DocumentoImovel,
  FotoImovel,
  Imovel,
} from '../database/entidades-catalogo.js';
import { ImovelRepository } from './imovel.repository.js';
import type {
  CategoriaDocumentoDto,
  DadosImovel,
  ListarImoveisDto,
  OrdenarFotosDto,
} from './imovel.schema.js';

type ArquivoEnviado = { filename: string; originalname: string };

@Injectable()
export class ImovelService {
  constructor(
    private readonly imoveis: ImovelRepository,
    private readonly arquivos: ArquivoAdapter,
    private readonly audit: AuditWriter,
  ) {}

  async listar(consulta: ListarImoveisDto) {
    const { rows, count } = await this.imoveis.listar({
      busca: consulta.busca,
      cidade: consulta.cidade || undefined,
      bairro: consulta.bairro || undefined,
      tipo: consulta.tipo || undefined,
      finalidade: consulta.finalidade || undefined,
      situacao: consulta.situacao || undefined,
      proprietarioId: consulta.proprietarioId || undefined,
      areaMinima: consulta.areaMinima,
      quartosMinimos: consulta.quartos,
      vagasMinimas: consulta.vagas,
      preco: this.filtroPreco(consulta),
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

  async buscarPorId(id: string) {
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async criar(dados: DadosImovel, ator: Ator) {
    await this.garantirProprietario(dados.proprietarioId);
    try {
      const imovel = await this.imoveis.criar(this.colunas(dados));
      await this.auditar(ator, 'IMOVEL_CRIADO', imovel.id, null, this.resumo(imovel));
      return this.apresentar(await this.obterOuFalhar(imovel.id));
    } catch (error) {
      rethrowConstraint(error, 'Já existe um imóvel com este código.');
    }
  }

  async atualizar(id: string, dados: DadosImovel, ator: Ator) {
    const imovel = await this.obterOuFalhar(id);
    const anterior = this.resumo(imovel);
    await this.garantirProprietario(dados.proprietarioId);
    try {
      await this.imoveis.atualizar(imovel, this.colunas(dados));
    } catch (error) {
      rethrowConstraint(error, 'Já existe um imóvel com este código.');
    }
    await this.auditar(ator, 'IMOVEL_ATUALIZADO', id, anterior, this.resumo(imovel));
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async excluir(id: string, ator: Ator) {
    const imovel = await this.obterOuFalhar(id);
    const anterior = this.resumo(imovel);
    const chaves = [
      ...(imovel.fotos ?? []).map((foto) => foto.chaveArquivo),
      ...(imovel.documentos ?? []).map((documento) => documento.chaveArquivo),
    ];
    await this.imoveis.excluir(imovel);
    await Promise.all(chaves.map((chave) => this.arquivos.remover(chave)));
    await this.auditar(ator, 'IMOVEL_EXCLUIDO', id, anterior, null);
  }

  async adicionarFoto(id: string, arquivo: ArquivoEnviado, ator: Ator) {
    await this.obterOuFalhar(id);
    const quantidade = await this.imoveis.contarFotos(id);
    if (quantidade >= 20) {
      await this.arquivos.remover(arquivo.filename);
      throw new BadRequestException('O imóvel pode ter no máximo 20 fotos.');
    }
    try {
      const foto = await this.imoveis.criarFoto({
        imovelId: id,
        chaveArquivo: arquivo.filename,
        nomeOriginal: arquivo.originalname,
        ordem: quantidade,
        principal: quantidade === 0,
      });
      await this.auditar(ator, 'FOTO_IMOVEL_ADICIONADA', id, null, { fotoId: foto.id });
      return this.fotoDe(foto);
    } catch (error) {
      await this.arquivos.remover(arquivo.filename);
      throw error;
    }
  }

  async definirFotoPrincipal(id: string, fotoId: string) {
    const foto = await this.obterFoto(id, fotoId);
    await this.imoveis.definirPrincipal(id, foto);
    return this.fotoDe(foto);
  }

  async reordenarFotos(id: string, dados: OrdenarFotosDto) {
    const fotos = await this.imoveis.listarFotos(id);
    const conhecidas = new Set(fotos.map((foto) => foto.id));
    if (dados.ids.length !== fotos.length || dados.ids.some((fotoId) => !conhecidas.has(fotoId))) {
      throw new BadRequestException('A ordem deve incluir todas as fotos do imóvel.');
    }
    await Promise.all(dados.ids.map((fotoId, indice) => this.imoveis.atualizarOrdem(fotoId, indice)));
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async removerFoto(id: string, fotoId: string, ator: Ator) {
    const foto = await this.obterFoto(id, fotoId);
    const eraPrincipal = foto.principal;
    await foto.destroy();
    await this.arquivos.remover(foto.chaveArquivo);
    if (eraPrincipal) {
      const proxima = await this.imoveis.proximaFotoPrincipal(id);
      if (proxima) await proxima.update({ principal: true });
    }
    await this.auditar(ator, 'FOTO_IMOVEL_REMOVIDA', id, { fotoId }, null);
  }

  async adicionarDocumento(
    id: string,
    arquivo: ArquivoEnviado,
    dados: CategoriaDocumentoDto,
    ator: Ator,
  ) {
    await this.obterOuFalhar(id);
    try {
      const documento = await this.imoveis.criarDocumento({
        imovelId: id,
        categoria: dados.categoria,
        chaveArquivo: arquivo.filename,
        nomeOriginal: arquivo.originalname,
      });
      await this.auditar(ator, 'DOCUMENTO_IMOVEL_ADICIONADO', id, null, {
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
    const documento = await this.imoveis.buscarDocumento(id, documentoId);
    if (!documento) {
      throw new NotFoundException('Documento não encontrado.');
    }
    await documento.destroy();
    await this.arquivos.remover(documento.chaveArquivo);
    await this.auditar(ator, 'DOCUMENTO_IMOVEL_REMOVIDO', id, {
      documentoId,
      categoria: documento.categoria,
    }, null);
  }

  private filtroPreco(consulta: ListarImoveisDto) {
    if (consulta.precoMinimo == null && consulta.precoMaximo == null) return undefined;
    const campo =
      consulta.finalidade === 'VENDA'
        ? 'valorVenda'
        : consulta.finalidade === 'ALUGUEL'
          ? 'valorAluguel'
          : 'ambos';
    return {
      campo,
      minimo: consulta.precoMinimo,
      maximo: consulta.precoMaximo,
    } as const;
  }

  private colunas(dados: DadosImovel) {
    return {
      codigo: dados.codigo,
      proprietarioId: dados.proprietarioId,
      tipo: dados.tipo,
      finalidade: dados.finalidade,
      situacao: dados.situacao,
      area: dados.area,
      quartos: dados.quartos,
      banheiros: dados.banheiros,
      vagas: dados.vagas,
      descricao: dados.descricao || null,
      valorVenda: dados.valorVenda ?? null,
      valorAluguel: dados.valorAluguel ?? null,
      valorCondominio: dados.valorCondominio ?? null,
      valorIptu: dados.valorIptu ?? null,
      ...colunasEndereco(dados.endereco),
    };
  }

  private async garantirProprietario(proprietarioId: string) {
    const proprietario = await this.imoveis.proprietarioExiste(proprietarioId);
    if (!proprietario) {
      throw new BadRequestException('Proprietário não encontrado.');
    }
  }

  private async obterOuFalhar(id: string) {
    const imovel = await this.imoveis.buscarPorId(id);
    if (!imovel) {
      throw new NotFoundException('Imóvel não encontrado.');
    }
    return imovel;
  }

  private async obterFoto(imovelId: string, fotoId: string) {
    const foto = await this.imoveis.buscarFoto(imovelId, fotoId);
    if (!foto) {
      throw new NotFoundException('Foto não encontrada.');
    }
    return foto;
  }

  private apresentar(imovel: Imovel) {
    const fotos = [...(imovel.fotos ?? [])].sort((a, b) => a.ordem - b.ordem);
    const documentos = [...(imovel.documentos ?? [])].sort((a, b) =>
      a.createdAt > b.createdAt ? 1 : -1,
    );
    return {
      ...this.paraLista(imovel),
      banheiros: imovel.banheiros,
      descricao: imovel.descricao,
      valorCondominio: this.dinheiro(imovel.valorCondominio),
      valorIptu: this.dinheiro(imovel.valorIptu),
      endereco: enderecoDe(imovel),
      proprietario: imovel.proprietario
        ? { id: imovel.proprietario.id, nome: imovel.proprietario.nome }
        : null,
      fotos: fotos.map((foto) => this.fotoDe(foto)),
      documentos: documentos.map((documento) => this.documentoDe(documento)),
    };
  }

  private paraLista(imovel: Imovel) {
    const principal = (imovel.fotos ?? []).find((foto) => foto.principal);
    return {
      id: imovel.id,
      codigo: imovel.codigo,
      tipo: imovel.tipo,
      finalidade: imovel.finalidade,
      situacao: imovel.situacao,
      cidade: imovel.cidade,
      bairro: imovel.bairro,
      uf: imovel.uf,
      area: Number(imovel.area),
      quartos: imovel.quartos,
      vagas: imovel.vagas,
      valorVenda: this.dinheiro(imovel.valorVenda),
      valorAluguel: this.dinheiro(imovel.valorAluguel),
      proprietarioId: imovel.proprietarioId,
      nomeProprietario: imovel.proprietario?.nome ?? null,
      urlFotoPrincipal: principal ? `/api/v1/arquivos/${principal.chaveArquivo}` : null,
    };
  }

  private fotoDe(foto: FotoImovel) {
    return {
      id: foto.id,
      url: `/api/v1/arquivos/${foto.chaveArquivo}`,
      nomeOriginal: foto.nomeOriginal,
      ordem: foto.ordem,
      principal: foto.principal,
    };
  }

  private documentoDe(documento: DocumentoImovel) {
    return {
      id: documento.id,
      url: `/api/v1/arquivos/${documento.chaveArquivo}`,
      nomeOriginal: documento.nomeOriginal,
      categoria: documento.categoria,
    };
  }

  private resumo(imovel: Imovel) {
    return {
      codigo: imovel.codigo,
      situacao: imovel.situacao,
      finalidade: imovel.finalidade,
      tipo: imovel.tipo,
      proprietarioId: imovel.proprietarioId,
      cidade: imovel.cidade,
      valorVenda: this.dinheiro(imovel.valorVenda),
      valorAluguel: this.dinheiro(imovel.valorAluguel),
    };
  }

  private dinheiro(valor: string | null) {
    return valor == null ? null : Number(valor);
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
      entity: 'Imovel',
      entityId,
      oldValues,
      newValues,
      ip: ator.ip ?? null,
      userAgent: ator.userAgent ?? null,
    });
  }
}

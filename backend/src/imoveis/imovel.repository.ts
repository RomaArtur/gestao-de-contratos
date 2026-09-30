import { Injectable } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import {
  DocumentoImovel,
  FotoImovel,
  Imovel,
  Proprietario,
} from '../database/entidades-catalogo.js';

export type FiltroPreco = {
  campo: 'valorVenda' | 'valorAluguel' | 'ambos';
  minimo?: number;
  maximo?: number;
};

export type FiltroImoveis = {
  busca?: string;
  cidade?: string;
  bairro?: string;
  tipo?: string;
  finalidade?: string;
  situacao?: string;
  proprietarioId?: string;
  areaMinima?: number;
  quartosMinimos?: number;
  vagasMinimas?: number;
  preco?: FiltroPreco;
  pagina: number;
  tamanhoPagina: number;
};

@Injectable()
export class ImovelRepository {
  listar(filtro: FiltroImoveis) {
    const where: WhereOptions[] = [];
    const busca = filtro.busca?.trim();
    if (busca) {
      const like = `%${busca.replace(/[%_]/g, '')}%`;
      where.push({
        [Op.or]: [
          { codigo: { [Op.iLike]: like } },
          { logradouro: { [Op.iLike]: like } },
          { bairro: { [Op.iLike]: like } },
          { cidade: { [Op.iLike]: like } },
        ],
      });
    }
    if (filtro.cidade) where.push({ cidade: { [Op.iLike]: filtro.cidade } });
    if (filtro.bairro) where.push({ bairro: { [Op.iLike]: filtro.bairro } });
    if (filtro.tipo) where.push({ tipo: filtro.tipo });
    if (filtro.finalidade) where.push({ finalidade: filtro.finalidade });
    if (filtro.situacao) where.push({ situacao: filtro.situacao });
    if (filtro.proprietarioId) where.push({ proprietarioId: filtro.proprietarioId });
    if (filtro.areaMinima != null) where.push({ area: { [Op.gte]: filtro.areaMinima } });
    if (filtro.quartosMinimos != null) where.push({ quartos: { [Op.gte]: filtro.quartosMinimos } });
    if (filtro.vagasMinimas != null) where.push({ vagas: { [Op.gte]: filtro.vagasMinimas } });
    if (filtro.preco) where.push(this.filtroPreco(filtro.preco));

    return Imovel.findAndCountAll({
      where: { [Op.and]: where.length ? where : [{}] },
      include: [
        { model: Proprietario, as: 'proprietario', attributes: ['id', 'nome'] },
        { model: FotoImovel, as: 'fotos' },
      ],
      distinct: true,
      order: [['createdAt', 'DESC']],
      limit: filtro.tamanhoPagina,
      offset: (filtro.pagina - 1) * filtro.tamanhoPagina,
    });
  }

  buscarPorId(id: string) {
    return Imovel.findByPk(id, {
      include: [
        { model: Proprietario, as: 'proprietario' },
        { model: FotoImovel, as: 'fotos' },
        { model: DocumentoImovel, as: 'documentos' },
      ],
    });
  }

  proprietarioExiste(id: string) {
    return Proprietario.findByPk(id, { attributes: ['id'] });
  }

  criar(dados: Record<string, unknown>) {
    return Imovel.create(dados);
  }

  atualizar(imovel: Imovel, dados: Record<string, unknown>) {
    return imovel.update(dados);
  }

  excluir(imovel: Imovel) {
    return imovel.destroy();
  }

  contarFotos(imovelId: string) {
    return FotoImovel.count({ where: { imovelId } });
  }

  listarFotos(imovelId: string) {
    return FotoImovel.findAll({ where: { imovelId } });
  }

  buscarFoto(imovelId: string, fotoId: string) {
    return FotoImovel.findOne({ where: { id: fotoId, imovelId } });
  }

  criarFoto(dados: Record<string, unknown>) {
    return FotoImovel.create(dados);
  }

  definirPrincipal(imovelId: string, foto: FotoImovel) {
    return FotoImovel.update({ principal: false }, { where: { imovelId } }).then(() =>
      foto.update({ principal: true }),
    );
  }

  atualizarOrdem(fotoId: string, ordem: number) {
    return FotoImovel.update({ ordem }, { where: { id: fotoId } });
  }

  proximaFotoPrincipal(imovelId: string) {
    return FotoImovel.findOne({ where: { imovelId }, order: [['ordem', 'ASC']] });
  }

  buscarDocumento(imovelId: string, documentoId: string) {
    return DocumentoImovel.findOne({ where: { id: documentoId, imovelId } });
  }

  criarDocumento(dados: Record<string, unknown>) {
    return DocumentoImovel.create(dados);
  }

  private filtroPreco(preco: FiltroPreco): WhereOptions {
    const faixa: Record<symbol, number> = {};
    if (preco.minimo != null) faixa[Op.gte] = preco.minimo;
    if (preco.maximo != null) faixa[Op.lte] = preco.maximo;
    if (preco.campo === 'valorVenda') return { valorVenda: faixa };
    if (preco.campo === 'valorAluguel') return { valorAluguel: faixa };
    return { [Op.or]: [{ valorVenda: faixa }, { valorAluguel: faixa }] };
  }
}

import { Injectable } from '@nestjs/common';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { Cliente, Imovel } from '../database/entidades-catalogo.js';
import {
  Contrato,
  DocumentoContrato,
  HistoricoContrato,
} from '../database/entidades-contrato.js';
import { Proposta } from '../database/entidades-proposta.js';
import { User } from '../database/models.js';

export type FiltroContratos = {
  busca?: string;
  situacao?: string;
  imovelId?: string;
  clienteId?: string;
  pagina: number;
  tamanhoPagina: number;
};

const inclusoes = [
  { model: Imovel, as: 'imovel', attributes: ['id', 'codigo', 'situacao'] },
  { model: Cliente, as: 'cliente', attributes: ['id', 'nome'] },
  { model: User, as: 'corretor', attributes: ['id', 'name'] },
];

@Injectable()
export class ContratoRepository {
  listar(filtro: FiltroContratos) {
    const where: WhereOptions[] = [];
    if (filtro.situacao) where.push({ situacao: filtro.situacao });
    if (filtro.imovelId) where.push({ imovelId: filtro.imovelId });
    if (filtro.clienteId) where.push({ clienteId: filtro.clienteId });
    const busca = filtro.busca?.trim();
    if (busca) {
      const like = `%${busca.replace(/[%_]/g, '')}%`;
      where.push({
        [Op.or]: [
          { codigo: { [Op.iLike]: like } },
          { '$imovel.codigo$': { [Op.iLike]: like } },
          { '$cliente.nome$': { [Op.iLike]: like } },
        ],
      });
    }

    return Contrato.findAndCountAll({
      where: { [Op.and]: where.length ? where : [{}] },
      include: inclusoes,
      distinct: true,
      subQuery: false,
      order: [['createdAt', 'DESC']],
      limit: filtro.tamanhoPagina,
      offset: (filtro.pagina - 1) * filtro.tamanhoPagina,
    });
  }

  listarPorCliente(clienteId: string) {
    return Contrato.findAll({
      where: { clienteId },
      include: [{ model: Imovel, as: 'imovel', attributes: ['id', 'codigo'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  buscarPorId(id: string, transaction?: Transaction) {
    return Contrato.findByPk(id, {
      include: [
        ...inclusoes,
        { model: DocumentoContrato, as: 'documentos' },
        {
          model: HistoricoContrato,
          as: 'historico',
          include: [{ model: User, as: 'usuario', attributes: ['id', 'name'] }],
        },
      ],
      transaction,
    });
  }

  buscarPorProposta(propostaId: string) {
    return Contrato.findOne({ where: { propostaId }, attributes: ['id'] });
  }

  buscarProposta(id: string) {
    return Proposta.findByPk(id);
  }

  buscarImovel(id: string) {
    return Imovel.findByPk(id);
  }

  async proximoCodigo(transaction: Transaction) {
    const registros = await Contrato.findAll({ attributes: ['codigo'], transaction });
    const maior = registros.reduce((atual, registro) => {
      const numero = Number(registro.codigo.replace(/\D/g, ''));
      return Number.isFinite(numero) ? Math.max(atual, numero) : atual;
    }, 0);
    return `CTR-${String(maior + 1).padStart(4, '0')}`;
  }

  criar(dados: Record<string, unknown>, transaction: Transaction) {
    return Contrato.create(dados, { transaction });
  }

  atualizar(contrato: Contrato, dados: Record<string, unknown>, transaction?: Transaction) {
    return contrato.update(dados, { transaction });
  }

  excluir(contrato: Contrato) {
    return contrato.destroy();
  }

  registrarHistorico(
    dados: {
      contratoId: string;
      situacaoAnterior: string | null;
      situacaoNova: string;
      observacao: string | null;
      usuarioId: string;
    },
    transaction?: Transaction,
  ) {
    return HistoricoContrato.create(dados, { transaction });
  }

  contarVigentes(imovelId: string, contratoId: string, transaction?: Transaction) {
    return Contrato.count({
      where: { imovelId, situacao: 'VIGENTE', id: { [Op.ne]: contratoId } },
      transaction,
    });
  }

  atualizarSituacaoImovel(imovel: Imovel, situacao: string, transaction: Transaction) {
    return imovel.update({ situacao }, { transaction });
  }

  contarDocumentos(contratoId: string) {
    return DocumentoContrato.count({ where: { contratoId } });
  }

  criarDocumento(dados: Record<string, unknown>) {
    return DocumentoContrato.create(dados);
  }

  buscarDocumento(contratoId: string, documentoId: string) {
    return DocumentoContrato.findOne({ where: { id: documentoId, contratoId } });
  }
}

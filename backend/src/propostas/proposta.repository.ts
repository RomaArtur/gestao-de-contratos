import { Injectable } from '@nestjs/common';
import { Op, type Transaction, type WhereOptions } from 'sequelize';
import { Cliente, Imovel } from '../database/entidades-catalogo.js';
import { HistoricoProposta, Proposta } from '../database/entidades-proposta.js';
import { User } from '../database/models.js';

export type FiltroPropostas = {
  busca?: string;
  situacao?: string;
  imovelId?: string;
  clienteId?: string;
  pagina: number;
  tamanhoPagina: number;
};

const inclusoes = [
  { model: Imovel, as: 'imovel', attributes: ['id', 'codigo', 'situacao', 'finalidade'] },
  { model: Cliente, as: 'cliente', attributes: ['id', 'nome'] },
  { model: User, as: 'corretor', attributes: ['id', 'name'] },
];

@Injectable()
export class PropostaRepository {
  listar(filtro: FiltroPropostas) {
    const where: WhereOptions[] = [];
    if (filtro.situacao) where.push({ situacao: filtro.situacao });
    if (filtro.imovelId) where.push({ imovelId: filtro.imovelId });
    if (filtro.clienteId) where.push({ clienteId: filtro.clienteId });
    const busca = filtro.busca?.trim();
    if (busca) {
      const like = `%${busca.replace(/[%_]/g, '')}%`;
      where.push({
        [Op.or]: [{ '$imovel.codigo$': { [Op.iLike]: like } }, { '$cliente.nome$': { [Op.iLike]: like } }],
      });
    }

    return Proposta.findAndCountAll({
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
    return Proposta.findAll({
      where: { clienteId },
      include: [{ model: Imovel, as: 'imovel', attributes: ['id', 'codigo'] }],
      order: [['createdAt', 'DESC']],
    });
  }

  buscarPorId(id: string, transaction?: Transaction) {
    return Proposta.findByPk(id, {
      include: [
        ...inclusoes,
        {
          model: HistoricoProposta,
          as: 'historico',
          include: [{ model: User, as: 'usuario', attributes: ['id', 'name'] }],
        },
      ],
      transaction,
    });
  }

  buscarImovel(id: string) {
    return Imovel.findByPk(id);
  }

  buscarCliente(id: string) {
    return Cliente.findByPk(id, { attributes: ['id'] });
  }

  criar(dados: Record<string, unknown>, transaction?: Transaction) {
    return Proposta.create(dados, { transaction });
  }

  atualizar(proposta: Proposta, dados: Record<string, unknown>, transaction?: Transaction) {
    return proposta.update(dados, { transaction });
  }

  excluir(proposta: Proposta) {
    return proposta.destroy();
  }

  registrarHistorico(
    dados: {
      propostaId: string;
      situacaoAnterior: string | null;
      situacaoNova: string;
      observacao: string | null;
      usuarioId: string;
    },
    transaction?: Transaction,
  ) {
    return HistoricoProposta.create(dados, { transaction });
  }

  async recusarOutrasEnviadas(
    imovelId: string,
    finalidade: string,
    propostaId: string,
    usuarioId: string,
    transaction: Transaction,
  ) {
    const outras = await Proposta.findAll({
      where: { imovelId, finalidade, situacao: 'ENVIADA', id: { [Op.ne]: propostaId } },
      transaction,
    });
    for (const outra of outras) {
      await outra.update({ situacao: 'RECUSADA', motivo: 'Substituída por outra proposta aceita.' }, { transaction });
      await this.registrarHistorico(
        {
          propostaId: outra.id,
          situacaoAnterior: 'ENVIADA',
          situacaoNova: 'RECUSADA',
          observacao: 'Substituída por outra proposta aceita.',
          usuarioId,
        },
        transaction,
      );
    }
  }

  contarAtivas(imovelId: string, transaction?: Transaction) {
    return Proposta.count({
      where: { imovelId, situacao: { [Op.in]: ['ENVIADA', 'ACEITA'] } },
      transaction,
    });
  }

  atualizarSituacaoImovel(imovel: Imovel, situacao: string, transaction?: Transaction) {
    return imovel.update({ situacao }, { transaction });
  }
}

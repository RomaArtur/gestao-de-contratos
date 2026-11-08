import { BadRequestException, Injectable } from '@nestjs/common';
import type { Transaction } from 'sequelize';
import { Imovel } from '../database/entidades-catalogo.js';

export const SITUACOES_IMOVEL_ABERTAS = new Set(['DISPONIVEL', 'EM_NEGOCIACAO', 'RESERVADO']);

const SITUACOES_DE_FLUXO = new Set(['EM_NEGOCIACAO', 'RESERVADO', 'ALUGADO', 'VENDIDO']);

export function ehSituacaoDeFluxo(situacao: string) {
  return SITUACOES_DE_FLUXO.has(situacao);
}

export function situacaoDeCadastro(pedida: string, atual?: string) {
  if (atual && ehSituacaoDeFluxo(atual)) {
    if (pedida !== atual) {
      throw new BadRequestException(
        'A situação deste imóvel é definida pela proposta ou pelo contrato.',
      );
    }
    return atual;
  }
  if (ehSituacaoDeFluxo(pedida)) {
    throw new BadRequestException('Esta situação é definida pela proposta ou pelo contrato.');
  }
  return pedida;
}

@Injectable()
export class SituacaoImovel {
  marcarNegociacao(imovel: Imovel, transaction?: Transaction) {
    if (imovel.situacao !== 'DISPONIVEL') return Promise.resolve(imovel);
    return imovel.update({ situacao: 'EM_NEGOCIACAO' }, { transaction });
  }

  reservar(imovel: Imovel, transaction?: Transaction) {
    if (imovel.situacao === 'VENDIDO' || imovel.situacao === 'ALUGADO') {
      return Promise.resolve(imovel);
    }
    return imovel.update({ situacao: 'RESERVADO' }, { transaction });
  }

  liberarSeSemPropostaAtiva(imovel: Imovel, propostasAtivas: number, transaction?: Transaction) {
    if (propostasAtivas > 0) return Promise.resolve(imovel);
    if (imovel.situacao !== 'EM_NEGOCIACAO' && imovel.situacao !== 'RESERVADO') {
      return Promise.resolve(imovel);
    }
    return imovel.update({ situacao: 'DISPONIVEL' }, { transaction });
  }

  ocuparPorContrato(imovel: Imovel, finalidade: string, transaction?: Transaction) {
    return imovel.update(
      { situacao: finalidade === 'ALUGUEL' ? 'ALUGADO' : 'VENDIDO' },
      { transaction },
    );
  }

  reconciliarOcupacao(
    imovel: Imovel,
    contas: { vigentes: number; aceitas: number; enviadas: number },
    transaction?: Transaction,
  ) {
    if (contas.vigentes > 0) return Promise.resolve(imovel);
    if (imovel.situacao !== 'VENDIDO' && imovel.situacao !== 'ALUGADO') {
      return Promise.resolve(imovel);
    }
    const situacao =
      contas.aceitas > 0 ? 'RESERVADO' : contas.enviadas > 0 ? 'EM_NEGOCIACAO' : 'DISPONIVEL';
    return imovel.update({ situacao }, { transaction });
  }
}

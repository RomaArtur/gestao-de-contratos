import { Inject, Injectable } from '@nestjs/common';
import { col, fn, Op, QueryTypes, type Model, type ModelStatic } from 'sequelize';
import { hojeIso, limitesVigencia } from '../comum/datas.js';
import { Imovel } from '../database/entidades-catalogo.js';
import { Contrato } from '../database/entidades-contrato.js';
import { SEQUELIZE } from '../database/database.module.js';
import { Proposta } from '../database/entidades-proposta.js';
import type { Sequelize } from 'sequelize';

type Contagem = { situacao: string; total: string | number };
type Pendencia = { tipo: 'imovel' | 'contrato'; id: string; titulo: string; detalhe: string };

const LIMITE_PENDENCIAS = 30;

@Injectable()
export class PainelService {
  constructor(@Inject(SEQUELIZE) private readonly sequelize: Sequelize) {}

  async resumo() {
    const { hoje, limite } = limitesVigencia(hojeIso());
    const vigente = { situacao: 'VIGENTE' as const };
    const [
      imoveis,
      propostas,
      contratos,
      contratosAtivos,
      contratosVencidos,
      contratosProximos,
      imoveisPorSituacao,
      propostasPorSituacao,
      contratosPorSituacao,
      documentos,
    ] = await Promise.all([
      Imovel.count(),
      Proposta.count(),
      Contrato.count(),
      Contrato.count({ where: { ...vigente, vencimento: { [Op.gte]: hoje } } }),
      Contrato.count({ where: { ...vigente, vencimento: { [Op.lt]: hoje } } }),
      Contrato.count({ where: { ...vigente, vencimento: { [Op.between]: [hoje, limite] } } }),
      this.porSituacao(Imovel),
      this.porSituacao(Proposta),
      this.porSituacao(Contrato),
      this.documentosPendentes(),
    ]);

    return {
      imoveis,
      propostas,
      contratos,
      contratosAtivos,
      contratosVencidos,
      contratosProximos,
      documentosPendentes: documentos.total,
      limitePendencias: LIMITE_PENDENCIAS,
      imoveisPorSituacao,
      propostasPorSituacao,
      contratosPorSituacao,
      pendencias: documentos.itens,
    };
  }

  private async porSituacao(modelo: ModelStatic<Model>) {
    const linhas = (await modelo.findAll({
      attributes: ['situacao', [fn('COUNT', col('id')), 'total']],
      group: ['situacao'],
      raw: true,
    })) as unknown as Contagem[];
    return linhas.map((linha) => ({ situacao: linha.situacao, total: Number(linha.total) }));
  }

  private async documentosPendentes() {
    const [imoveisTotal, contratosTotal, imoveis, contratos] = await Promise.all([
      this.contar(`SELECT COUNT(*)::int AS total FROM imoveis i WHERE NOT EXISTS (
        SELECT 1 FROM documentos_imovel d WHERE d.imovel_id = i.id
      )`),
      this.contar(`SELECT COUNT(*)::int AS total FROM contratos c
        WHERE c.situacao IN ('MINUTA', 'VIGENTE')
          AND NOT EXISTS (
            SELECT 1 FROM documentos_contrato d
            WHERE d.contrato_id = c.id AND d.categoria = 'ASSINADO'
          )`),
      this.sequelize.query<{ id: string; codigo: string }>(
        `SELECT i.id, i.codigo FROM imoveis i
         WHERE NOT EXISTS (SELECT 1 FROM documentos_imovel d WHERE d.imovel_id = i.id)
         ORDER BY i.codigo
         LIMIT ${LIMITE_PENDENCIAS}`,
        { type: QueryTypes.SELECT },
      ),
      this.sequelize.query<{ id: string; codigo: string }>(
        `SELECT c.id, c.codigo FROM contratos c
         WHERE c.situacao IN ('MINUTA', 'VIGENTE')
           AND NOT EXISTS (
             SELECT 1 FROM documentos_contrato d
             WHERE d.contrato_id = c.id AND d.categoria = 'ASSINADO'
           )
         ORDER BY c.codigo
         LIMIT ${LIMITE_PENDENCIAS}`,
        { type: QueryTypes.SELECT },
      ),
    ]);

    const itens: Pendencia[] = [
      ...imoveis.map((item) => ({
        tipo: 'imovel' as const,
        id: item.id,
        titulo: item.codigo,
        detalhe: 'Imóvel sem documento',
      })),
      ...contratos.map((item) => ({
        tipo: 'contrato' as const,
        id: item.id,
        titulo: item.codigo,
        detalhe: 'Contrato sem documento assinado',
      })),
    ];
    return { total: imoveisTotal + contratosTotal, itens };
  }

  private async contar(sql: string) {
    const linhas = await this.sequelize.query<{ total: number }>(sql, { type: QueryTypes.SELECT });
    return Number(linhas[0]?.total ?? 0);
  }
}

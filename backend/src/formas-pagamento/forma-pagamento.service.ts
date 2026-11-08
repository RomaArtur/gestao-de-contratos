import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditWriter } from '../audit/audit-entry.js';
import { registrarAuditoria } from '../audit/registrar.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import type { Ator } from '../comum/ator.js';
import { FormaPagamento } from '../database/entidades-catalogo.js';
import { Contrato, ModeloContrato } from '../database/entidades-contrato.js';
import { htmlModelo } from '../contratos/modelos-texto.js';
import { Proposta } from '../database/entidades-proposta.js';
import type { DadosFormaPagamento } from './forma-pagamento.schema.js';

@Injectable()
export class FormaPagamentoService {
  constructor(private readonly audit: AuditWriter) {}

  async listar(somenteAtivas = false) {
    const registros = await FormaPagamento.findAll({
      where: somenteAtivas ? { ativo: true } : undefined,
      order: [['nome', 'ASC']],
    });
    return registros.map((forma) => this.apresentar(forma));
  }

  async buscarPorId(id: string) {
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async garantirUtilizavel(id: string, permitirInativa = false) {
    const forma = await FormaPagamento.findByPk(id);
    if (!forma || (!forma.ativo && !permitirInativa)) {
      throw new BadRequestException('Selecione uma forma de pagamento ativa.');
    }
    return forma.id;
  }

  async criar(dados: DadosFormaPagamento, ator: Ator) {
    try {
      const forma = await FormaPagamento.create({
        nome: dados.nome,
        ativo: dados.ativo ?? true,
      });
      await ModeloContrato.create({ formaPagamentoId: forma.id, conteudo: htmlModelo(forma.nome) });
      await registrarAuditoria(this.audit, ator, 'FORMA_PAGAMENTO_CRIADA', 'FormaPagamento', forma.id, null, {
        nome: forma.nome,
      });
      return this.apresentar(forma);
    } catch (error) {
      rethrowConstraint(error, 'Já existe uma forma de pagamento com este nome.');
    }
  }

  async atualizar(id: string, dados: DadosFormaPagamento, ator: Ator) {
    const forma = await this.obterOuFalhar(id);
    const anterior = this.apresentar(forma);
    try {
      await forma.update({ nome: dados.nome, ativo: dados.ativo ?? forma.ativo });
    } catch (error) {
      rethrowConstraint(error, 'Já existe uma forma de pagamento com este nome.');
    }
    await registrarAuditoria(this.audit, ator, 'FORMA_PAGAMENTO_ATUALIZADA', 'FormaPagamento', id, anterior, {
      nome: forma.nome,
      ativo: forma.ativo,
    });
    return this.apresentar(forma);
  }

  async excluir(id: string, ator: Ator) {
    const forma = await this.obterOuFalhar(id);
    const [propostas, contratos] = await Promise.all([
      Proposta.count({ where: { formaPagamentoId: id } }),
      Contrato.count({ where: { formaPagamentoId: id } }),
    ]);
    if (propostas + contratos > 0) {
      throw new BadRequestException('Esta forma de pagamento está em uso em propostas ou contratos.');
    }
    try {
      await ModeloContrato.destroy({ where: { formaPagamentoId: id } });
      await forma.destroy();
    } catch (error) {
      rethrowConstraint(
        error,
        'Já existe uma forma de pagamento com este nome.',
        'Esta forma de pagamento está em uso em propostas ou contratos.',
      );
    }
    await registrarAuditoria(this.audit, ator, 'FORMA_PAGAMENTO_EXCLUIDA', 'FormaPagamento', id, {
      nome: forma.nome,
    }, null);
  }

  private async obterOuFalhar(id: string) {
    const forma = await FormaPagamento.findByPk(id);
    if (!forma) throw new NotFoundException('Forma de pagamento não encontrada.');
    return forma;
  }

  private apresentar(forma: FormaPagamento) {
    return { id: forma.id, nome: forma.nome, ativo: forma.ativo };
  }
}

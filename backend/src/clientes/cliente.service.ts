import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditWriter } from '../audit/audit-entry.js';
import { registrarAuditoria } from '../audit/registrar.js';
import { FieldCipher } from '../common/crypto/crypto.module.js';
import { formatDocument } from '../common/crypto/documents.js';
import { documentLookup, maskDocument } from '../common/crypto/field-cipher.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import type { Ator } from '../comum/ator.js';
import { colunasEndereco, enderecoDe } from '../comum/endereco.js';
import { Cliente } from '../database/entidades-catalogo.js';
import { ContratoService } from '../contratos/contrato.service.js';
import { PropostaService } from '../propostas/proposta.service.js';
import { ClienteRepository } from './cliente.repository.js';
import { digitosDocumento, type DadosCliente, type ListarClientesDto } from './cliente.schema.js';

@Injectable()
export class ClienteService {
  constructor(
    private readonly clientes: ClienteRepository,
    private readonly propostas: PropostaService,
    private readonly contratos: ContratoService,
    private readonly cipher: FieldCipher,
    private readonly audit: AuditWriter,
  ) {}

  async listar(consulta: ListarClientesDto) {
    const digitos = consulta.busca?.replace(/\D/g, '') ?? '';
    const { rows, count } = await this.clientes.listar({
      busca: consulta.busca,
      tipo: consulta.tipo || undefined,
      documentoBusca:
        digitos.length === 11 || digitos.length === 14 ? documentLookup(digitos) : undefined,
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
    const cliente = await this.obterOuFalhar(id);
    const [propostas, contratos] = await Promise.all([
      this.propostas.listarPorCliente(id),
      this.contratos.listarPorCliente(id),
    ]);
    return {
      ...this.apresentar(cliente),
      historico: {
        propostas: propostas.map((proposta) => ({
          id: proposta.id,
          codigoImovel: proposta.codigoImovel,
          valor: proposta.valor,
          situacao: proposta.situacao,
          finalidade: proposta.finalidade,
        })),
        contratos: contratos.map((contrato) => ({
          id: contrato.id,
          codigo: contrato.codigo,
          codigoImovel: contrato.codigoImovel,
          valor: contrato.valor,
          situacao: contrato.situacao,
          vencimento: contrato.vencimento,
        })),
      },
    };
  }

  async criar(dados: DadosCliente, ator: Ator) {
    const digitos = digitosDocumento(dados.documento);
    try {
      const cliente = await this.clientes.criar(this.colunas(dados, digitos));
      await this.auditar(ator, 'CLIENTE_CRIADO', cliente.id, null, cliente, digitos);
      return this.apresentar(cliente);
    } catch (error) {
      rethrowConstraint(error, 'Já existe um cliente com este CPF/CNPJ.');
    }
  }

  async atualizar(id: string, dados: DadosCliente, ator: Ator) {
    const cliente = await this.obterOuFalhar(id);
    const anterior = this.resumo(cliente, this.cipher.decrypt(cliente.documentoCifrado));
    const digitos = digitosDocumento(dados.documento);
    try {
      await this.clientes.atualizar(cliente, this.colunas(dados, digitos));
    } catch (error) {
      rethrowConstraint(error, 'Já existe um cliente com este CPF/CNPJ.');
    }
    await this.auditar(ator, 'CLIENTE_ATUALIZADO', cliente.id, anterior, cliente, digitos);
    return this.apresentar(cliente);
  }

  async excluir(id: string, ator: Ator) {
    const cliente = await this.obterOuFalhar(id);
    const digitos = this.cipher.decrypt(cliente.documentoCifrado);
    const anterior = this.resumo(cliente, digitos);
    try {
      await this.clientes.excluir(cliente);
    } catch (error) {
      rethrowConstraint(
        error,
        'Não foi possível excluir o cliente.',
        'Este cliente está vinculado a propostas, contratos ou eventos.',
      );
    }
    await registrarAuditoria(this.audit, ator, 'CLIENTE_EXCLUIDO', 'Cliente', id, anterior, null);
  }

  private colunas(dados: DadosCliente, digitos: string) {
    return {
      nome: dados.nome,
      documentoCifrado: this.cipher.encrypt(digitos),
      documentoBusca: documentLookup(digitos),
      telefone: dados.telefone,
      whatsapp: dados.whatsapp || null,
      email: dados.email.trim().toLowerCase(),
      tipo: dados.tipo,
      observacoes: dados.observacoes || null,
      ...colunasEndereco(dados.endereco),
    };
  }

  private async obterOuFalhar(id: string) {
    const cliente = await this.clientes.buscarPorId(id);
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado.');
    }
    return cliente;
  }

  private apresentar(cliente: Cliente) {
    const digitos = this.cipher.decrypt(cliente.documentoCifrado);
    return {
      id: cliente.id,
      nome: cliente.nome,
      documento: formatDocument(digitos),
      telefone: cliente.telefone,
      whatsapp: cliente.whatsapp,
      email: cliente.email,
      tipo: cliente.tipo,
      observacoes: cliente.observacoes,
      endereco: enderecoDe(cliente),
    };
  }

  private paraLista(cliente: Cliente) {
    const digitos = this.cipher.decrypt(cliente.documentoCifrado);
    return {
      id: cliente.id,
      nome: cliente.nome,
      documento: maskDocument(digitos),
      email: cliente.email,
      telefone: cliente.telefone,
      tipo: cliente.tipo,
      cidade: cliente.cidade,
      uf: cliente.uf,
    };
  }

  private resumo(cliente: Cliente, digitos: string) {
    return {
      nome: cliente.nome,
      tipo: cliente.tipo,
      email: cliente.email,
      telefone: cliente.telefone,
      cidade: cliente.cidade,
      documento: maskDocument(digitos),
    };
  }

  private auditar(
    ator: Ator,
    action: string,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    cliente: Cliente,
    digitos: string,
  ) {
    return registrarAuditoria(
      this.audit,
      ator,
      action,
      'Cliente',
      entityId,
      oldValues,
      this.resumo(cliente, digitos),
    );
  }
}

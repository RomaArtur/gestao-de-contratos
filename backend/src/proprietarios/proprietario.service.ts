import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditWriter } from '../audit/audit-entry.js';
import { FieldCipher } from '../common/crypto/crypto.module.js';
import { formatDocument } from '../common/crypto/documents.js';
import { documentLookup, maskDocument } from '../common/crypto/field-cipher.js';
import { rethrowConstraint } from '../common/sequelize-errors.js';
import { colunasEndereco, enderecoDe } from '../comum/endereco.js';
import type { Ator } from '../comum/ator.js';
import { Proprietario } from '../database/entidades-catalogo.js';
import {
  digitosDocumento,
  type DadosProprietario,
  type ListarProprietariosDto,
} from './proprietario.schema.js';
import { ProprietarioRepository } from './proprietario.repository.js';

@Injectable()
export class ProprietarioService {
  constructor(
    private readonly proprietarios: ProprietarioRepository,
    private readonly cipher: FieldCipher,
    private readonly audit: AuditWriter,
  ) {}

  async listar(consulta: ListarProprietariosDto) {
    const digitos = consulta.busca?.replace(/\D/g, '') ?? '';
    const { rows, count } = await this.proprietarios.listar({
      busca: consulta.busca,
      tipoPessoa: consulta.tipoPessoa || undefined,
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
    return this.apresentar(await this.obterOuFalhar(id));
  }

  async criar(dados: DadosProprietario, ator: Ator) {
    const digitos = digitosDocumento(dados.documento);
    try {
      const proprietario = await this.proprietarios.criar(this.colunas(dados, digitos));
      await this.auditar(ator, 'PROPRIETARIO_CRIADO', proprietario.id, null, proprietario, digitos);
      return this.apresentar(proprietario);
    } catch (error) {
      rethrowConstraint(error, 'Já existe um proprietário com este CPF/CNPJ.');
    }
  }

  async atualizar(id: string, dados: DadosProprietario, ator: Ator) {
    const proprietario = await this.obterOuFalhar(id);
    const anterior = this.resumo(proprietario, this.cipher.decrypt(proprietario.documentoCifrado));
    const digitos = digitosDocumento(dados.documento);
    try {
      await this.proprietarios.atualizar(proprietario, this.colunas(dados, digitos));
    } catch (error) {
      rethrowConstraint(error, 'Já existe um proprietário com este CPF/CNPJ.');
    }
    await this.auditar(ator, 'PROPRIETARIO_ATUALIZADO', proprietario.id, anterior, proprietario, digitos);
    return this.apresentar(proprietario);
  }

  async excluir(id: string, ator: Ator) {
    const proprietario = await this.obterOuFalhar(id);
    const digitos = this.cipher.decrypt(proprietario.documentoCifrado);
    const anterior = this.resumo(proprietario, digitos);
    try {
      await this.proprietarios.excluir(proprietario);
    } catch (error) {
      rethrowConstraint(
        error,
        'Não foi possível excluir o proprietário.',
        'Este proprietário possui imóveis vinculados.',
      );
    }
    await this.audit.record({
      userId: ator.usuarioId,
      action: 'PROPRIETARIO_EXCLUIDO',
      entity: 'Proprietario',
      entityId: id,
      oldValues: anterior,
      newValues: null,
      ip: ator.ip ?? null,
      userAgent: ator.userAgent ?? null,
    });
  }

  private colunas(dados: DadosProprietario, digitos: string) {
    return {
      tipoPessoa: dados.tipoPessoa,
      nome: dados.nome,
      nomeFantasia: dados.tipoPessoa === 'JURIDICA' ? dados.nomeFantasia || null : null,
      documentoCifrado: this.cipher.encrypt(digitos),
      documentoBusca: documentLookup(digitos),
      dataNascimento: dados.tipoPessoa === 'FISICA' ? dados.dataNascimento || null : null,
      telefone: dados.telefone,
      email: dados.email.trim().toLowerCase(),
      nomeResponsavel: dados.tipoPessoa === 'JURIDICA' ? dados.nomeResponsavel : null,
      ...colunasEndereco(dados.endereco),
    };
  }

  private async obterOuFalhar(id: string) {
    const proprietario = await this.proprietarios.buscarPorId(id);
    if (!proprietario) {
      throw new NotFoundException('Proprietário não encontrado.');
    }
    return proprietario;
  }

  private apresentar(proprietario: Proprietario) {
    const digitos = this.cipher.decrypt(proprietario.documentoCifrado);
    return {
      id: proprietario.id,
      tipoPessoa: proprietario.tipoPessoa,
      nome: proprietario.nome,
      nomeFantasia: proprietario.nomeFantasia,
      documento: formatDocument(digitos),
      dataNascimento: proprietario.dataNascimento,
      telefone: proprietario.telefone,
      email: proprietario.email,
      nomeResponsavel: proprietario.nomeResponsavel,
      endereco: enderecoDe(proprietario),
    };
  }

  private paraLista(proprietario: Proprietario) {
    const digitos = this.cipher.decrypt(proprietario.documentoCifrado);
    return {
      id: proprietario.id,
      tipoPessoa: proprietario.tipoPessoa,
      nome: proprietario.nome,
      nomeFantasia: proprietario.nomeFantasia,
      documento: maskDocument(digitos),
      email: proprietario.email,
      telefone: proprietario.telefone,
      cidade: proprietario.cidade,
      uf: proprietario.uf,
    };
  }

  private resumo(proprietario: Proprietario, digitos: string) {
    return {
      nome: proprietario.nome,
      tipoPessoa: proprietario.tipoPessoa,
      email: proprietario.email,
      telefone: proprietario.telefone,
      cidade: proprietario.cidade,
      documento: maskDocument(digitos),
    };
  }

  private auditar(
    ator: Ator,
    action: string,
    entityId: string,
    oldValues: Record<string, unknown> | null,
    proprietario: Proprietario,
    digitos: string,
  ) {
    return this.audit.record({
      userId: ator.usuarioId,
      action,
      entity: 'Proprietario',
      entityId,
      oldValues,
      newValues: this.resumo(proprietario, digitos),
      ip: ator.ip ?? null,
      userAgent: ator.userAgent ?? null,
    });
  }
}

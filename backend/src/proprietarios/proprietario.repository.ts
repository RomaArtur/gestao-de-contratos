import { Injectable } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import { Proprietario } from '../database/entidades-catalogo.js';

export type FiltroProprietarios = {
  busca?: string;
  documentoBusca?: string;
  tipoPessoa?: string;
  pagina: number;
  tamanhoPagina: number;
};

@Injectable()
export class ProprietarioRepository {
  listar(filtro: FiltroProprietarios) {
    const where: WhereOptions = {};
    const busca = filtro.busca?.trim();
    if (busca) {
      const like = `%${busca.replace(/[%_]/g, '')}%`;
      const ou: WhereOptions[] = [
        { nome: { [Op.iLike]: like } },
        { nomeFantasia: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { cidade: { [Op.iLike]: like } },
      ];
      if (filtro.documentoBusca) {
        ou.push({ documentoBusca: filtro.documentoBusca });
      }
      Object.assign(where, { [Op.or]: ou });
    }
    if (filtro.tipoPessoa) {
      Object.assign(where, { tipoPessoa: filtro.tipoPessoa });
    }

    return Proprietario.findAndCountAll({
      where,
      order: [['nome', 'ASC']],
      limit: filtro.tamanhoPagina,
      offset: (filtro.pagina - 1) * filtro.tamanhoPagina,
    });
  }

  buscarPorId(id: string) {
    return Proprietario.findByPk(id);
  }

  criar(dados: Record<string, unknown>) {
    return Proprietario.create(dados);
  }

  atualizar(proprietario: Proprietario, dados: Record<string, unknown>) {
    return proprietario.update(dados);
  }

  excluir(proprietario: Proprietario) {
    return proprietario.destroy();
  }
}

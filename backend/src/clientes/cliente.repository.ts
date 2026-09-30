import { Injectable } from '@nestjs/common';
import { Op, type WhereOptions } from 'sequelize';
import { Cliente } from '../database/entidades-catalogo.js';

export type FiltroClientes = {
  busca?: string;
  documentoBusca?: string;
  tipo?: string;
  pagina: number;
  tamanhoPagina: number;
};

@Injectable()
export class ClienteRepository {
  listar(filtro: FiltroClientes) {
    const where: WhereOptions = {};
    const busca = filtro.busca?.trim();
    if (busca) {
      const like = `%${busca.replace(/[%_]/g, '')}%`;
      const ou: WhereOptions[] = [
        { nome: { [Op.iLike]: like } },
        { email: { [Op.iLike]: like } },
        { cidade: { [Op.iLike]: like } },
        { telefone: { [Op.iLike]: like } },
      ];
      if (filtro.documentoBusca) {
        ou.push({ documentoBusca: filtro.documentoBusca });
      }
      Object.assign(where, { [Op.or]: ou });
    }
    if (filtro.tipo) {
      Object.assign(where, { tipo: filtro.tipo });
    }

    return Cliente.findAndCountAll({
      where,
      order: [['nome', 'ASC']],
      limit: filtro.tamanhoPagina,
      offset: (filtro.pagina - 1) * filtro.tamanhoPagina,
    });
  }

  buscarPorId(id: string) {
    return Cliente.findByPk(id);
  }

  criar(dados: Record<string, unknown>) {
    return Cliente.create(dados);
  }

  atualizar(cliente: Cliente, dados: Record<string, unknown>) {
    return cliente.update(dados);
  }

  excluir(cliente: Cliente) {
    return cliente.destroy();
  }
}

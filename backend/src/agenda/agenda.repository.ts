import { Injectable } from '@nestjs/common';
import { Op } from 'sequelize';
import { Cliente, Imovel } from '../database/entidades-catalogo.js';
import { Evento } from '../database/entidades-agenda.js';
import { Contrato } from '../database/entidades-contrato.js';

const inclusoes = [
  { model: Imovel, as: 'imovel', attributes: ['id', 'codigo'], required: false },
  { model: Cliente, as: 'cliente', attributes: ['id', 'nome'], required: false },
  { model: Contrato, as: 'contrato', attributes: ['id', 'codigo'], required: false },
];

@Injectable()
export class AgendaRepository {
  listar(inicio: Date, fim: Date) {
    return Evento.findAll({
      where: {
        inicio: { [Op.lt]: fim },
        fim: { [Op.gt]: inicio },
      },
      include: inclusoes,
      order: [['inicio', 'ASC']],
    });
  }

  buscarPorId(id: string) {
    return Evento.findByPk(id, { include: inclusoes });
  }

  criar(dados: Record<string, unknown>) {
    return Evento.create(dados);
  }

  atualizar(evento: Evento, dados: Record<string, unknown>) {
    return evento.update(dados);
  }

  buscarImovel(id: string) {
    return Imovel.findByPk(id, { attributes: ['id'] });
  }

  buscarCliente(id: string) {
    return Cliente.findByPk(id, { attributes: ['id'] });
  }

  buscarContrato(id: string) {
    return Contrato.findByPk(id, { attributes: ['id'] });
  }
}

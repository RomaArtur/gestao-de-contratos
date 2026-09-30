import argon2 from 'argon2';
import { Role, User } from './models.js';

export async function seedAdmin(input: {
  email?: string;
  password?: string;
  name?: string;
}) {
  if (!input.email || !input.password) {
    return;
  }

  const email = input.email.trim().toLowerCase();
  const existing = await User.findOne({ where: { email } });
  if (existing) {
    return;
  }

  const role = await Role.findOne({ where: { code: 'ADMIN' } });
  if (!role) {
    throw new Error('Perfil ADMIN não encontrado. Rode as migrations.');
  }

  await User.create({
    name: input.name?.trim() || 'Administrador',
    email,
    passwordHash: await argon2.hash(input.password),
    roleId: role.id,
    active: true,
  });
}

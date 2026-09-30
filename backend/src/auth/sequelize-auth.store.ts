import { Injectable } from '@nestjs/common';
import { RefreshToken, Role, User } from '../database/models.js';
import {
  AuthStore,
  type AuthUser,
  type StoredRefreshToken,
} from './auth-user.js';

function toAuthUser(user: User): AuthUser | null {
  if (!user.role) {
    return null;
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    passwordHash: user.passwordHash,
    active: user.active,
    role: user.role.code,
  };
}

@Injectable()
export class SequelizeAuthStore extends AuthStore {
  async findUserByEmail(email: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });
    return user ? toAuthUser(user) : null;
  }

  async findUserById(id: string) {
    const user = await User.findOne({
      where: { id },
      include: [{ model: Role, as: 'role' }],
    });
    return user ? toAuthUser(user) : null;
  }

  async saveRefreshToken(input: {
    userId: string;
    jti: string;
    expiresAt: Date;
  }) {
    await RefreshToken.create(input);
  }

  async findRefreshToken(jti: string): Promise<StoredRefreshToken | null> {
    const token = await RefreshToken.findOne({ where: { jti } });
    if (!token) {
      return null;
    }
    return {
      userId: token.userId,
      expiresAt: token.expiresAt,
      revokedAt: token.revokedAt,
    };
  }

  async revokeRefreshToken(jti: string) {
    await RefreshToken.update(
      { revokedAt: new Date() },
      { where: { jti, revokedAt: null } },
    );
  }
}

import { randomUUID } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuditWriter } from '../audit/audit-entry.js';
import { ttlToSeconds } from '../config/duration.js';
import { AuthStore, type AuthUser } from './auth-user.js';
import { PasswordService } from './password.service.js';

export type RequestMeta = {
  ip?: string;
  userAgent?: string;
};

type RefreshPayload = {
  sub: string;
  jti: string;
  type: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly store: AuthStore,
    private readonly audit: AuditWriter,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(
    input: { email: string; password: string },
    meta: RequestMeta,
  ) {
    const email = input.email.trim().toLowerCase();
    const user = await this.store.findUserByEmail(email);

    if (!user || !user.active) {
      await this.record(meta, {
        userId: user?.id ?? null,
        action: 'LOGIN_FAILED',
        entityId: user?.id ?? null,
        newValues: {
          email,
          reason: user ? 'inactive' : 'unknown_email',
        },
      });
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const passwordMatches = await this.passwords.verify(
      user.passwordHash,
      input.password,
    );
    if (!passwordMatches) {
      await this.record(meta, {
        userId: user.id,
        action: 'LOGIN_FAILED',
        entityId: user.id,
        newValues: { email, reason: 'invalid_password' },
      });
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    const tokens = await this.issueTokens(user);
    await this.record(meta, {
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
    });

    return { ...tokens, user: this.publicUser(user) };
  }

  async refresh(refreshToken: string, meta: RequestMeta) {
    const payload = await this.readRefreshToken(refreshToken);
    const user = await this.store.findUserById(payload.sub);
    if (!user || !user.active) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    await this.store.revokeRefreshToken(payload.jti);
    const tokens = await this.issueTokens(user);
    await this.record(meta, {
      userId: user.id,
      action: 'TOKEN_REFRESH',
      entityId: user.id,
      newValues: { email: user.email },
    });
    return { ...tokens, user: this.publicUser(user) };
  }

  async logout(refreshToken: string, meta: RequestMeta) {
    try {
      const payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
      if (payload.type === 'refresh' && payload.jti) {
        await this.store.revokeRefreshToken(payload.jti);
        await this.record(meta, {
          userId: payload.sub ?? null,
          action: 'LOGOUT',
          entityId: payload.sub ?? null,
          newValues: null,
        });
      }
    } catch {
      return;
    }
  }

  async me(userId: string) {
    const user = await this.store.findUserById(userId);
    if (!user || !user.active) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    return this.publicUser(user);
  }

  private async issueTokens(user: AuthUser) {
    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    });
    const jti = randomUUID();
    const refreshTtl = this.config.getOrThrow<string>('JWT_REFRESH_TTL');
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti, type: 'refresh' },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: ttlToSeconds(refreshTtl),
      },
    );
    await this.store.saveRefreshToken({
      userId: user.id,
      jti,
      expiresAt: new Date(Date.now() + ttlToSeconds(refreshTtl) * 1000),
    });
    return { accessToken, refreshToken };
  }

  private async readRefreshToken(refreshToken: string) {
    let payload: RefreshPayload;
    try {
      payload = await this.jwt.verifyAsync<RefreshPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Sessão inválida.');
    }
    if (payload.type !== 'refresh' || !payload.jti || !payload.sub) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    const stored = await this.store.findRefreshToken(payload.jti);
    if (
      !stored ||
      stored.userId !== payload.sub ||
      stored.revokedAt ||
      stored.expiresAt.getTime() <= Date.now()
    ) {
      throw new UnauthorizedException('Sessão inválida.');
    }
    return payload;
  }

  private publicUser(user: AuthUser) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  private record(
    meta: RequestMeta,
    entry: {
      userId: string | null;
      action: string;
      entityId: string | null;
      newValues: Record<string, unknown> | null;
    },
  ) {
    return this.audit.record({
      userId: entry.userId,
      action: entry.action,
      entity: 'User',
      entityId: entry.entityId,
      oldValues: null,
      newValues: entry.newValues,
      ip: meta.ip ?? null,
      userAgent: meta.userAgent ?? null,
    });
  }
}

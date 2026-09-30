import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuditWriter } from '../audit/audit-entry.js';
import { AuthStore } from './auth-user.js';
import { AuthService } from './auth.service.js';
import { PasswordService } from './password.service.js';

const corretor = {
  id: 'user-1',
  name: 'Corretor',
  email: 'corretor@imobiliaria.local',
  passwordHash: 'hash',
  active: true,
  role: 'CORRETOR',
};

describe('AuthService', () => {
  const store = {
    findUserByEmail: vi.fn(),
    findUserById: vi.fn(),
    saveRefreshToken: vi.fn(),
    findRefreshToken: vi.fn(),
    revokeRefreshToken: vi.fn(),
  };
  const audit = { record: vi.fn() };
  const passwords = { hash: vi.fn(), verify: vi.fn() };
  const jwt = { signAsync: vi.fn(), verifyAsync: vi.fn() };
  const config = {
    getOrThrow: vi.fn((key: string) => {
      const values: Record<string, string> = {
        JWT_ACCESS_TTL: '15m',
        JWT_REFRESH_TTL: '7d',
        JWT_REFRESH_SECRET: 'refresh-secret-value',
      };
      return values[key];
    }),
  };

  let service: AuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthStore, useValue: store },
        { provide: AuditWriter, useValue: audit },
        { provide: PasswordService, useValue: passwords },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(AuthService);
  });

  it('rejeita senha inválida e registra a falha na auditoria', async () => {
    store.findUserByEmail.mockResolvedValue(corretor);
    passwords.verify.mockResolvedValue(false);

    await expect(
      service.login(
        { email: corretor.email, password: 'senha-errada' },
        { ip: '127.0.0.1' },
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'LOGIN_FAILED',
        userId: corretor.id,
        newValues: expect.objectContaining({ reason: 'invalid_password' }),
      }),
    );
  });

  it('devolve o perfil do usuário autenticado', async () => {
    store.findUserByEmail.mockResolvedValue(corretor);
    passwords.verify.mockResolvedValue(true);
    jwt.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');

    const result = await service.login(
      { email: corretor.email, password: 'senha-certa' },
      {},
    );

    expect(result.user.role).toBe('CORRETOR');
    expect(result.user.email).toBe(corretor.email);
    expect(result.accessToken).toBe('access-token');
    expect(store.saveRefreshToken).toHaveBeenCalledOnce();
  });
});

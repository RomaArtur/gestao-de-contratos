export type AuthUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: boolean;
  role: string;
};

export type StoredRefreshToken = {
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export abstract class AuthStore {
  abstract findUserByEmail(email: string): Promise<AuthUser | null>;
  abstract findUserById(id: string): Promise<AuthUser | null>;
  abstract saveRefreshToken(input: {
    userId: string;
    jti: string;
    expiresAt: Date;
  }): Promise<void>;
  abstract findRefreshToken(jti: string): Promise<StoredRefreshToken | null>;
  abstract revokeRefreshToken(jti: string): Promise<void>;
}

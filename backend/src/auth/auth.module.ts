import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ttlToSeconds } from '../config/duration.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthStore } from './auth-user.js';
import { JwtStrategy } from './jwt.strategy.js';
import { PasswordService } from './password.service.js';
import { RolesGuard } from './roles.guard.js';
import { SequelizeAuthStore } from './sequelize-auth.store.js';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: ttlToSeconds(config.getOrThrow<string>('JWT_ACCESS_TTL')),
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    JwtStrategy,
    RolesGuard,
    { provide: AuthStore, useClass: SequelizeAuthStore },
  ],
})
export class AuthModule {}

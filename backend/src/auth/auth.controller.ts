import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService, type RequestMeta } from './auth.service.js';
import { CurrentUser, type AuthenticatedUser } from './current-user.decorator.js';
import { LoginDto, RefreshDto } from './dto/auth.dto.js';
import { Roles } from './roles.decorator.js';
import { RolesGuard } from './roles.guard.js';

function metaFrom(request: Request): RequestMeta {
  const userAgent = request.headers['user-agent'];
  return {
    ip: request.ip,
    userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
  };
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  login(@Body() body: LoginDto, @Req() request: Request) {
    return this.auth.login(body, metaFrom(request));
  }

  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  refresh(@Body() body: RefreshDto, @Req() request: Request) {
    return this.auth.refresh(body.refreshToken, metaFrom(request));
  }

  @Post('logout')
  @HttpCode(204)
  logout(@Body() body: RefreshDto, @Req() request: Request) {
    return this.auth.logout(body.refreshToken, metaFrom(request));
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('ADMIN', 'CORRETOR')
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user.id);
  }
}

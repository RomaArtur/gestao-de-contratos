import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
};

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    return request.user;
  },
);

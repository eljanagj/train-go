// common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      ctx.getHandler(),
    );
    if (!requiredRoles) return true;  

    const request = ctx.switchToHttp().getRequest();
    const user = request.user as { roles?: string[] };
    const userRoles = user.roles || [];
    return requiredRoles.some(r => userRoles.includes(r));
  }
}

import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../../modules/user/user.service';
import { AUTH_DISABLED } from '../../config/auth.config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly users: UserService) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    if (AUTH_DISABLED) {
      const req = ctx.switchToHttp().getRequest();
      let user = await this.users.findByAuth0Id('local-dev');
      if (!user) {
        user = await this.users.createFromAuth0({
          sub: 'local-dev',
          email: 'dev@local.test',
          name: 'Dev User',
        });
      }
      req.user = Object.assign(user, { roles: ['Admin'] });
      return true;
    }

    const allowed = (await super.canActivate(ctx)) as boolean;
    if (!allowed) return false;

    const req = ctx.switchToHttp().getRequest();
    const payload = req.user as { sub: string; roles?: string[] };
    let user = await this.users.findByAuth0Id(payload.sub);
    if (!user) {
      user = await this.users.createFromAuth0(payload);
    }

    const roles: string[] = payload.roles ?? [];
    req.user = Object.assign(user, { roles });
    return true;
  }
}

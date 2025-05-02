import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from '../../modules/user/user.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly users: UserService) {
    super();
  }

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const allowed = (await super.canActivate(ctx)) as boolean;
    if (!allowed) return false;

    const req = ctx.switchToHttp().getRequest();
    const claims = req.user as { sub: string; email: string; name?: string };
    let user = await this.users.findByAuth0Id(claims.sub);
    if (!user) {
      user = await this.users.createFromAuth0(claims);
    }
    req.user = user;
    return true;
  }
}
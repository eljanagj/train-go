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
    const payload = req.user as any;    
    let user = await this.users.findByAuth0Id(payload.sub);
    if (!user) {
      user = await this.users.createFromAuth0(payload);
    }

    const roles: string[] = payload['roles'] || [];
    const authUser = Object.assign(user, { roles });

    req.user = authUser;
    return true;
  }
}
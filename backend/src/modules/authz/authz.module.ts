import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { APP_GUARD }    from '@nestjs/core';
import { UserModule }    from '../user/user.module';

@Module({
    imports: [PassportModule.register({ defaultStrategy: 'jwt' }),UserModule,],
    controllers: [AuthController],
    providers: [JwtStrategy, {
        provide: APP_GUARD,        
        useClass: JwtAuthGuard,
      }],
    exports: [PassportModule],
})
export class AuthzModule {}

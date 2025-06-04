import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RouteController } from './route.controller';
import { RouteService } from './route.service';
import { Route } from './route.entity';
import { Train } from '../train/entities/train.entity';
import { AuthzModule } from '../authz/authz.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [TypeOrmModule.forFeature([Route, Train]), AuthzModule],
  controllers: [RouteController],
  providers: [RouteService],
})
export class RouteModule {}

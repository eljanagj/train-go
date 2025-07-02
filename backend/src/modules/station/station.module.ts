import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Station } from './entities/station.entity';
import { Route } from '../route/route.entity';
import { StationService } from './station.service';
import { StationController } from './station.controller';
import { AuthzModule } from '../authz/authz.module';

@Module({
  imports: [TypeOrmModule.forFeature([Station, Route]), AuthzModule],
  controllers: [StationController],
  providers: [StationService],
  exports: [StationService],
})
export class StationModule {}

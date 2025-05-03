import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule } from './schedule.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';
import { Train } from '../train/entities/train.entity';
import { Route } from '../route/route.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Train, Route])],
  providers: [ScheduleService],
  controllers: [ScheduleController],
})
export class ScheduleModule {}

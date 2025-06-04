import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Maintenance } from './entities/maintenance.entity';
import { Train } from '../train/entities/train.entity';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceScheduler } from './maintenance.scheduler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Maintenance, Train]),
    ScheduleModule.forRoot(),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService, MaintenanceScheduler],
  exports: [MaintenanceService],
})
export class MaintenanceModule {} 
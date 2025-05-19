import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { SeatsModule } from '../seats/seats.module';
import { Schedule } from '../schedule/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Schedule]),
    SeatsModule
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {} 
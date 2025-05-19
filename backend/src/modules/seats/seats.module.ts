import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeatsService } from './seats.service';
import { SeatsController } from './seats.controller';
import { Seat } from './entities/seat.entity';
import { Train } from '../train/entities/train.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Seat, Train])],
  controllers: [SeatsController],
  providers: [SeatsService],
  exports: [SeatsService],
})
export class SeatsModule {} 
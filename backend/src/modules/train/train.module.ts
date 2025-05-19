import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Train } from './entities/train.entity';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { Seat } from '../seats/entities/seat.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Train, Seat])],
  controllers: [TrainController],
  providers: [TrainService],
})
export class TrainModule {}

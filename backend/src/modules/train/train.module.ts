import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Train } from './entities/train.entity';
import { TrainService } from './train.service';
import { TrainController } from './train.controller';
import { Seat } from '../seats/entities/seat.entity';
import { AuthzModule } from '../authz/authz.module';
import { SeatsModule } from '../seats/seats.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Train, Seat]),
    AuthzModule,
    SeatsModule
  ],
  controllers: [TrainController],
  providers: [TrainService],
  exports: [TrainService],
})
export class TrainModule {}

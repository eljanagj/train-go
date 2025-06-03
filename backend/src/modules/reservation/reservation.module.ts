import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { Schedule } from '../schedule/schedule.entity';
import { SeatsModule } from '../seats/seats.module';
import { PaymentModule } from '../payment/payment.module';
import { PdfModule } from '../pdf/pdf.module';
import { TicketModule } from '../ticket/ticket.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Schedule]),
    SeatsModule,
    PaymentModule,
    PdfModule,
    TicketModule,
    NotificationsModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
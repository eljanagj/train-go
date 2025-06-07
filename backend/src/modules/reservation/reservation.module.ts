import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReservationService } from './reservation.service';
import { ReservationController } from './reservation.controller';
import { Reservation } from './entities/reservation.entity';
import { Schedule } from '../schedule/schedule.entity';
import { User } from '../user/entities/user.entity';
import { DiscountCode } from '../discountCode/entities/discount.entity';
import { SeatsModule } from '../seats/seats.module';
import { PaymentModule } from '../payment/payment.module';
import { PdfModule } from '../pdf/pdf.module';
import { TicketModule } from '../ticket/ticket.module';
import { AuthzModule } from '../authz/authz.module';
import { DiscountCodeModule } from '../discountCode/discount.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Reservation, Schedule, User, DiscountCode]),
    SeatsModule,
    PaymentModule,
    PdfModule,
    TicketModule,
    AuthzModule,
    DiscountCodeModule,
  ],
  controllers: [ReservationController],
  providers: [ReservationService],
  exports: [ReservationService],
})
export class ReservationModule {}
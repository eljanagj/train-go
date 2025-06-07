import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountCodeService } from './discount.service';
import { DiscountCodeController } from './discount.controller';
import { DiscountAutomationService } from './discount-automation.service';
import { DiscountCode } from './entities/discount.entity';
import { User } from '../user/entities/user.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DiscountCode, User, Reservation])],
  controllers: [DiscountCodeController],
  providers: [DiscountCodeService, DiscountAutomationService],
  exports: [DiscountCodeService, DiscountAutomationService],
})
export class DiscountCodeModule {}

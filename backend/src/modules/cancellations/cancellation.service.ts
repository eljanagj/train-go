import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CancellationRequest, CancellationStatus } from './cancellation-request.entity';
import { Reservation, ReservationStatus } from '../reservation/entities/reservation.entity';
import { User } from '../user/entities/user.entity';
import { Payment } from '../../modules/payment/entities/payment.entity';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class CancellationService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(CancellationRequest)
    private cancellationRepo: Repository<CancellationRequest>,
    @InjectRepository(Reservation)
    private reservationRepo: Repository<Reservation>,
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    private configService: ConfigService,
  ) {
    this.stripe = new Stripe(this.configService.get<string>('STRIPE_SECRET_KEY')!, {
      apiVersion: '2025-05-28.basil',
    });
  }

  async createCancellationRequest(reservationId: string, reason: string) {
    const reservation = await this.reservationRepo.findOne({ where: { id: reservationId } });
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    const existingRequest = await this.cancellationRepo.findOne({
      where: { reservation: { id: reservationId }, status: CancellationStatus.PENDING },
    });

    if (existingRequest) {
      console.warn(`Pending cancellation request already exists for reservation ${reservationId}. Returning existing request.`);
      return existingRequest;
    }

    const cancellationRequest = this.cancellationRepo.create({
      reservation,
      reason,
      status: CancellationStatus.PENDING,
    });
    return this.cancellationRepo.save(cancellationRequest);
  }

  async getAllCancellationRequests() {
    return this.cancellationRepo.find({
      relations: ['reservation', 'reservation.user', 'reservation.schedule'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateCancellationStatus(
    cancellationId: string,
    status: CancellationStatus,
    adminId: string,
    adminNotes?: string,
    refundAmount?: number,
  ) {
    const cancellation = await this.cancellationRepo.findOne({ 
      where: { id: cancellationId }, 
      relations: ['reservation', 'reservation.user', 'reservation.schedule', 'reservation.payment']
    });
    if (!cancellation) {
      throw new NotFoundException('Cancellation request not found');
    }
    cancellation.status = status;
    if (adminNotes) cancellation.adminNotes = adminNotes;
    if (refundAmount !== undefined) cancellation.refundAmount = refundAmount;
    // Optionally, set reviewedBy if you have the admin user entity
    // cancellation.reviewedBy = ...

    if (status === CancellationStatus.APPROVED) {
      cancellation.reservation.status = ReservationStatus.CANCELLED;
      await this.reservationRepo.save(cancellation.reservation);

      if (refundAmount && cancellation.reservation.payment && cancellation.reservation.payment.paymentIntentId) {
        try {
          console.log(`Attempting Stripe refund for payment intent: ${cancellation.reservation.payment.paymentIntentId} with amount: ${refundAmount}`);
          await this.stripe.refunds.create({
            payment_intent: cancellation.reservation.payment.paymentIntentId,
            amount: Math.round(refundAmount * 100),
          });
          console.log('Stripe refund successful.');
        } catch (stripeError) {
          console.error('Stripe refund failed:', stripeError);
          // Optionally, you might want to throw an error here or update cancellation status to reflect refund failure
        }
      }
    }
    return this.cancellationRepo.save(cancellation);
  }

  async deleteCancellation(id: string) {
    const cancellationRequest = await this.cancellationRepo.findOne({
      where: { id },
      relations: ['reservation', 'reservation.user', 'reservation.schedule', 'reservation.payment'],
    });

    if (!cancellationRequest) {
      throw new NotFoundException('Cancellation request not found');
    }

    // 1. Delete the cancellation request first
    await this.cancellationRepo.remove(cancellationRequest);
    console.log(`Deleted cancellation request: ${cancellationRequest.id}`);

    // 2. Delete the associated payment if it exists
    if (cancellationRequest.reservation && cancellationRequest.reservation.payment) {
      console.log(`Deleting associated payment for reservation: ${cancellationRequest.reservation.id}`);
      await this.paymentRepo.remove(cancellationRequest.reservation.payment);
    }

    // 3. Delete the associated reservation if its status is CANCELLED
    if (cancellationRequest.reservation.status === ReservationStatus.CANCELLED) {
      console.log(`Deleting associated reservation: ${cancellationRequest.reservation.id}`);
      await this.reservationRepo.remove(cancellationRequest.reservation);
    }

    return { message: 'Cancellation request and associated reservation deleted successfully' };
  }
} 
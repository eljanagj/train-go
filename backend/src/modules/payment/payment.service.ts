import { Injectable, BadRequestException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { Payment, PaymentStatus, PaymentMethod } from './entities/payment.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    private configService: ConfigService
  ) {
    const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    this.stripe = new Stripe(stripeKey);
  }

  async createPaymentIntent(amount: number, currency: string = 'eur'): Promise<{ clientSecret: string }> {
    try {
      if (!amount || amount <= 0) {
        throw new BadRequestException('Invalid amount');
      }

      const amountInCents = Math.round(amount * 100);
      console.log('Creating payment intent:', { amount, amountInCents, currency });

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
        capture_method: 'automatic',
        confirmation_method: 'automatic',
      });

      console.log('Payment intent created:', { id: paymentIntent.id, status: paymentIntent.status });

      if (!paymentIntent.client_secret) {
        throw new InternalServerErrorException('No client secret returned from Stripe');
      }

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error creating payment intent:', error);
      throw new InternalServerErrorException('Failed to create payment intent');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      if (!paymentIntentId) {
        throw new BadRequestException('Payment intent ID is required');
      }

      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error retrieving payment intent:', error);
      throw new InternalServerErrorException('Failed to retrieve payment intent');
    }
  }

  async retrievePaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      if (!paymentMethodId) {
        throw new BadRequestException('Payment method ID is required');
      }

      return await this.stripe.paymentMethods.retrieve(paymentMethodId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error retrieving payment method:', error);
      throw new InternalServerErrorException('Failed to retrieve payment method');
    }
  }

  async createPayment(reservationId: string, amount: number, currency: string = 'eur'): Promise<Payment> {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId }
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: { reservationId }
    });

    if (existingPayment) {
      // If payment exists and is completed, return it
      if (existingPayment.status === PaymentStatus.COMPLETED) {
        return existingPayment;
      }

      // If payment exists but is pending or failed, create a new payment intent
      // This allows retry of failed payments with a fresh payment intent
      const { clientSecret } = await this.createPaymentIntent(amount, currency);
      const paymentIntentId = clientSecret.split('_secret_')[0];

      existingPayment.paymentIntentId = paymentIntentId;
      existingPayment.status = PaymentStatus.PENDING;
      existingPayment.failureReason = null;

      return await this.paymentRepository.save(existingPayment);
    }

    // Create Stripe payment intent
    const { clientSecret } = await this.createPaymentIntent(amount, currency);
    const paymentIntentId = clientSecret.split('_secret_')[0];

    const payment = this.paymentRepository.create({
      reservationId,
      amount,
      currency,
      status: PaymentStatus.PENDING,
      paymentIntentId,
    });

    return await this.paymentRepository.save(payment);
  }

  async updatePaymentStatus(paymentId: string, paymentIntentId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['reservation']
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${paymentId} not found`);
    }

    // Validate payment intent ID
    if (paymentIntentId !== payment.paymentIntentId) {
      throw new BadRequestException(`Payment intent ID mismatch`);
    }

    const paymentIntent = await this.retrievePaymentIntent(paymentIntentId);

    console.log('Stripe payment intent status:', {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency
    });

    if (paymentIntent.status === 'succeeded') {
      payment.status = PaymentStatus.COMPLETED;
      payment.paymentDate = new Date();

      // Extract payment method details
      if (paymentIntent.payment_method) {
        const paymentMethod = await this.retrievePaymentMethod(paymentIntent.payment_method as string);
        payment.paymentMethod = PaymentMethod.CARD;
        payment.paymentCardLast4 = paymentMethod.card?.last4 || null;
        payment.paymentCardBrand = paymentMethod.card?.brand || null;
      }

      payment.transactionId = paymentIntent.id;

      console.log('Setting payment status to COMPLETED:', {
        paymentId: payment.id,
        newStatus: payment.status,
        paymentDate: payment.paymentDate
      });
    } else if (paymentIntent.status === 'canceled' || paymentIntent.status === 'requires_payment_method') {
      payment.status = PaymentStatus.FAILED;
      payment.failureReason = paymentIntent.last_payment_error?.message || 'Payment failed';

      console.log('Setting payment status to FAILED:', {
        paymentId: payment.id,
        newStatus: payment.status,
        failureReason: payment.failureReason
      });
    }

    const savedPayment = await this.paymentRepository.save(payment);

    console.log('Payment saved to database:', {
      paymentId: savedPayment.id,
      status: savedPayment.status,
      paymentDate: savedPayment.paymentDate,
      amount: savedPayment.amount
    });

    return savedPayment;
  }

  async findByReservationId(reservationId: string): Promise<Payment | null> {
    return await this.paymentRepository.findOne({
      where: { reservationId },
      relations: ['reservation']
    });
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['reservation']
    });

    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }

    return payment;
  }

  async findAllForAdmin(): Promise<Payment[]> {
    const payments = await this.paymentRepository.find({
      relations: ['reservation', 'reservation.schedule', 'reservation.schedule.train', 'reservation.schedule.route', 'reservation.user'],
      order: { createdAt: 'DESC' }
    });

    console.log('Admin payments query result:', payments.map(p => ({
      id: p.id,
      status: p.status,
      amount: p.amount,
      paymentDate: p.paymentDate,
      reservationId: p.reservationId
    })));

    return payments;
  }
}
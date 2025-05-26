import { Controller, Post, Body, Get, Param, NotFoundException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { Reservation } from '../reservation/entities/reservation.entity';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
  ) {}

  @Post('create-payment-intent')
  @ApiOperation({ summary: 'Create a payment intent' })
  async createPaymentIntent(
    @Body() body: { amount: number; currency?: string },
  ) {
    return this.paymentService.createPaymentIntent(body.amount, body.currency);
  }

  @Get('create-payment-intent/:reservationId')
  @ApiOperation({ summary: 'Create a payment intent for a reservation' })
  async createPaymentIntentForReservation(
    @Param('reservationId') reservationId: string,
  ) {
    const reservation = await this.reservationRepository.findOne({
      where: { id: reservationId }
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${reservationId} not found`);
    }

    return this.paymentService.createPaymentIntent(Number(reservation.price), 'eur');
  }

  @Get('payment-intent/:id')
  @ApiOperation({ summary: 'Retrieve a payment intent' })
  async getPaymentIntent(@Param('id') id: string) {
    return this.paymentService.retrievePaymentIntent(id);
  }

  @Post('reservation/:reservationId')
  @ApiOperation({ summary: 'Create a payment for a reservation' })
  async createPaymentForReservation(
    @Param('reservationId') reservationId: string,
    @Body() body: { amount: number; currency?: string }
  ): Promise<Payment> {
    return this.paymentService.createPayment(reservationId, body.amount, body.currency);
  }

  @Get('reservation/:reservationId')
  @ApiOperation({ summary: 'Get payment by reservation ID' })
  async getPaymentByReservation(@Param('reservationId') reservationId: string): Promise<Payment | null> {
    return this.paymentService.findByReservationId(reservationId);
  }

  @Get('admin/all')
  @ApiOperation({ summary: 'Get all payments for admin' })
  @ApiResponse({ status: 200, description: 'Returns list of all payments with reservation details' })
  async getAllPaymentsForAdmin(): Promise<Payment[]> {
    return this.paymentService.findAllForAdmin();
  }

  @Get('debug/status')
  @ApiOperation({ summary: 'Debug endpoint to check payment statuses' })
  async debugPaymentStatuses() {
    const payments = await this.paymentService.findAllForAdmin();
    return {
      totalPayments: payments.length,
      statusBreakdown: payments.reduce((acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      }, {}),
      recentPayments: payments.slice(0, 5).map(p => ({
        id: p.id,
        status: p.status,
        amount: p.amount,
        paymentDate: p.paymentDate,
        createdAt: p.createdAt,
        reservationId: p.reservationId
      }))
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  async getPaymentById(@Param('id') id: string): Promise<Payment> {
    return this.paymentService.findById(id);
  }

  @Post(':id/update-status')
  @ApiOperation({ summary: 'Update payment status' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @Body() body: { paymentIntentId: string }
  ): Promise<Payment> {
    return this.paymentService.updatePaymentStatus(id, body.paymentIntentId);
  }
}
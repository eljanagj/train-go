import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { SeatsService } from '../seats/seats.service.js';
import { PaymentService } from '../payment/payment.service';
import { Seat } from '../seats/entities/seat.entity';
import { Schedule } from '../schedule/schedule.entity';
import { Payment, PaymentStatus } from '../payment/entities/payment.entity';
import { TicketService } from '../ticket/ticket.service';
import { CancelReservationDto } from './dto/cancel-reservation.dto';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

// Simplified interface - Reservation entity now directly includes seats relation
export interface ReservationWithSeat extends Reservation {
  clientSecret?: string;
}

@Injectable()
export class ReservationService {
  private readonly logger = new Logger(ReservationService.name);

  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private seatsService: SeatsService,
    private paymentService: PaymentService,
    private ticketService: TicketService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationWithSeat> {
    console.log('CreateReservationDto:', createReservationDto);
    try {
      const schedule = await this.scheduleRepository.findOne({
        where: { id: createReservationDto.scheduleId },
        relations: ['train', 'route']
      });

      if (!schedule) {
        throw new NotFoundException(`Schedule with ID ${createReservationDto.scheduleId} not found`);
      }

      // Combine travelDate with schedule times
      const travelDate = new Date(createReservationDto.travelDate);
      const [depHours, depMinutes] = schedule.departureTime.split(':').map(Number);
      const [arrHours, arrMinutes] = schedule.arrivalTime.split(':').map(Number);

      const departureDateTime = new Date(travelDate);
      departureDateTime.setHours(depHours, depMinutes, 0);

      const arrivalDateTime = new Date(travelDate);
      arrivalDateTime.setHours(arrHours, arrMinutes, 0);

      // Validate that the travel date is valid
      if (travelDate.toISOString().split('T')[0] !== new Date(createReservationDto.travelDate).toISOString().split('T')[0]) {
        throw new BadRequestException('Travel date must match the intended schedule date');
      }

      const seatConfigData = await this.seatsService.getSeatDetails(String(schedule.train.trainID));
      const availableSeats = await this.seatsService.getAvailableSeats(
        schedule.train.trainID,
        travelDate.toISOString().split('T')[0],
        schedule.departureTime
      );

      const requestedSeats = createReservationDto.seatNumbers.map(seatNumber => {
        const seatData = seatConfigData[seatNumber];
        if (!seatData) {
          throw new BadRequestException(`Seat ${seatNumber} not found`);
        }
        if (!availableSeats.includes(seatNumber)) {
          throw new BadRequestException(`Seat ${seatNumber} is not available`);
        }
        return { seatNumber, ...seatData };
      });

      if (requestedSeats.length === 0) {
        throw new BadRequestException('No seats selected for reservation');
      }

      // Calculate total price: Base route price + sum of selected seat prices
      const totalSeatsPrice = requestedSeats.reduce((sum, seat) => sum + Number(seat.price), 0);
      const totalPrice = Number(schedule.route.price) + totalSeatsPrice;

      // Create the reservation entity
      const reservation = this.reservationRepository.create({
        userId,
        scheduleId: createReservationDto.scheduleId,
        passengerName: createReservationDto.passengerName,
        passengerSurname: createReservationDto.passengerSurname,
        travelDate: new Date(createReservationDto.travelDate),
        discountCode: createReservationDto.discountCode,
        status: ReservationStatus.PAYMENT_PENDING,
        price: totalPrice,
        seats: requestedSeats,
        seatNumbers: createReservationDto.seatNumbers,
      } as Partial<Reservation>);

      // Save the reservation to the database
      const savedReservation = await this.reservationRepository.save(reservation);

      // Create payment for the reservation
      const payment = await this.paymentService.createPayment(savedReservation.id, totalPrice);

      console.log('Creating reservation with payment:', {
        reservationId: savedReservation.id,
        paymentId: payment.id,
        totalPrice,
        travelDate: createReservationDto.travelDate,
        seatNumbers: createReservationDto.seatNumbers
      });

      // Mark all selected seats as reserved
      try {
        await Promise.all(requestedSeats.map(seat => 
          this.seatsService.reserveSeat(
            String(schedule.train.trainID),
            travelDate.toISOString().split('T')[0],
            schedule.departureTime,
            seat.seatNumber,
            userId
          )
        ));
      } catch (error) {
        // Rollback reservation if seat reservation fails
        await this.reservationRepository.remove(savedReservation);
        console.error('Error reserving one or more seats:', error);
        throw error;
      }

      // Return the created reservation with payment details
      const result: ReservationWithSeat = {
        ...savedReservation,
        clientSecret: payment.paymentIntentId ? `${payment.paymentIntentId}_secret_placeholder` : undefined
      };

      // Send notifications to admins and user 
      await this.notificationsService.sendNotification(
        `New reservation created for ${createReservationDto.passengerName} ${createReservationDto.passengerSurname}`,
        'Admin'
      );

      await this.notificationsService.sendNotification(
        `Your trip has been reserved successfully!`,
        'User',
        userId
      );

      return result;

    } catch (error) {
      console.error('Error in ReservationService.create:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create reservation: ' + (error.message || error));
    }
  }

  async findAll(userId: string): Promise<ReservationWithSeat[]> {
    // Load seats relation and filter by userId
    const reservations = await this.reservationRepository.find({
      where: { userId },
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket', 'seats'],
    });

    // Return reservations with loaded seats, cast to ReservationWithSeat array
    return reservations as ReservationWithSeat[];
  }

  async findOne(id: string): Promise<ReservationWithSeat> {
    // Load seats relation
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket', 'seats'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Return reservation with loaded seats, cast to ReservationWithSeat
    return reservation as ReservationWithSeat;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<ReservationWithSeat> {
    // Load seats relation
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateReservationDto);
    // Save and return - assert save result
    return await this.reservationRepository.save(reservation) as ReservationWithSeat;
  }

  async remove(id: string): Promise<void> {
    // Load seats relation to release them
    const reservation = await this.findOne(id);
    const schedule = await this.scheduleRepository.findOne({
      where: { id: reservation.scheduleId },
      relations: ['train']
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Release all associated seats
    if (reservation.seats && reservation.seats.length > 0) {
      await Promise.all(reservation.seats.map(seat => 
        this.seatsService.releaseSeat(
          String(schedule.train.trainID),
          reservation.travelDate.toISOString().split('T')[0],
          schedule.departureTime,
          seat.seatNumber,
          reservation.userId
        )
      ));
    }

    // Remove the reservation
    await this.reservationRepository.remove(reservation as Reservation);
  }

  async cancelReservation(id: string, cancelDto?: CancelReservationDto): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id);
    const schedule = await this.scheduleRepository.findOne({
      where: { id: reservation.scheduleId },
      relations: ['train']
    });

    if (!schedule) {
      throw new NotFoundException('Schedule not found');
    }

    // Check if reservation exists
    if (!reservation) {
      throw new NotFoundException('Reservation not found');
    }

    // Check if reservation can be cancelled based on status
    if (reservation.status === ReservationStatus.CANCELLED) {
      throw new BadRequestException('Reservation is already cancelled');
    }

    if (reservation.status === ReservationStatus.COMPLETED) {
      throw new BadRequestException('Cannot cancel a completed reservation');
    }

    // Get current time and travel date
    const now = new Date();
    const travelDate = new Date(reservation.travelDate);

    // Calculate hours until departure
    const hoursTillDeparture = (travelDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    console.log('Cancellation time check:', {
      now: now.toISOString(),
      travelDate: travelDate.toISOString(),
      hoursTillDeparture: hoursTillDeparture,
      reservationId: id
    });

    // Check if cancellation is within allowed time window (2 hours before departure)
    if (hoursTillDeparture < 2) {
      throw new ForbiddenException('Cannot cancel reservation less than 2 hours before departure time');
    }

    try {
      // Release all associated seats
      if (reservation.seats && reservation.seats.length > 0) {
        await Promise.all(reservation.seats.map(seat => 
          this.seatsService.releaseSeat(
            String(schedule.train.trainID),
            reservation.travelDate.toISOString().split('T')[0],
            schedule.departureTime,
            seat.seatNumber,
            reservation.userId
          )
        ));
      }

      // Update reservation status and cancellation details
      reservation.status = ReservationStatus.CANCELLED;
      reservation.cancellationReason = cancelDto?.reason || 'Cancelled by user';
      reservation.cancellationDate = now;

      // Save the updated reservation
      const cancelledReservation = await this.reservationRepository.save(reservation);

      console.log('Reservation cancelled successfully:', {
        reservationId: cancelledReservation.id,
        status: cancelledReservation.status,
        cancellationReason: cancelledReservation.cancellationReason,
        cancellationDate: cancelledReservation.cancellationDate,
        hoursTillDeparture: hoursTillDeparture
      });

      // Return the cancelled reservation with all relations loaded
      return this.findOne(cancelledReservation.id);
    } catch (error) {
      console.error('Error during reservation cancellation:', error);
      throw new BadRequestException('Failed to cancel reservation: ' + error.message);
    }
  }

  async confirmReservation(id: string): Promise<ReservationWithSeat> {
    // Load seats relation
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.PAYMENT_PENDING) {
      throw new BadRequestException('Only pending or payment_pending reservations can be confirmed');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    // Save and re-fetch - assert save result
    const confirmedReservation = await this.reservationRepository.save(reservation) as Reservation;

    // Automatically create ticket when payment is confirmed (if not already created)
    if (confirmedReservation.payment?.status === PaymentStatus.COMPLETED) {
      try {
        // Check if ticket already exists to avoid duplicates
        const existingTicket = await this.ticketService.findByReservationId(confirmedReservation.id);
        if (!existingTicket) {
          const ticket = await this.ticketService.createTicket(confirmedReservation.id);
          console.log('Ticket created automatically:', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            reservationId: confirmedReservation.id
          });
        }
      } catch (error) {
        console.error('Error creating ticket after payment confirmation:', error);
      }
    }

    // Re-fetch to ensure relations are loaded for the return type
    return this.findOne(confirmedReservation.id);
  }

  async getReservationsBySchedule(scheduleId: number): Promise<ReservationWithSeat[]> {
    // Load seats relation
    const reservations = await this.reservationRepository.find({
      where: { scheduleId },
      relations: ['schedule', 'schedule.train', 'user', 'seats'],
    });

    // Return reservations with loaded seats, cast to ReservationWithSeat array
    return reservations as ReservationWithSeat[];
  }

  async findBySchedule(scheduleId: number): Promise<ReservationWithSeat[]> {
    return this.getReservationsBySchedule(scheduleId);
  }

  async updatePaymentStatus(id: string, paymentIntentId: string): Promise<ReservationWithSeat> {
    try {
      const reservation = await this.findOne(id);
      if (!reservation) {
        throw new NotFoundException('Reservation not found');
      }

      this.logger.debug('Found reservation:', {
        id: reservation.id,
        seats: reservation.seats,
        schedule: reservation.schedule
      });

      const payment = await this.paymentService.findByReservationId(id);
      if (!payment) {
        throw new NotFoundException('Payment not found for this reservation');
      }

      // Update payment status
      const updatedPayment = await this.paymentService.updatePaymentStatus(payment.id, paymentIntentId);

      // Update reservation status based on payment status
      if (updatedPayment.status === PaymentStatus.COMPLETED) {
        reservation.status = ReservationStatus.CONFIRMED;
        
        // Confirm all seats in the reservation
        try {
          this.logger.debug('Starting seat confirmation process', {
            trainId: reservation.schedule.train.trainID,
            date: reservation.travelDate.toISOString().split('T')[0],
            time: reservation.schedule.departureTime,
            seats: reservation.seats.map(s => s.seatNumber)
          });

          await Promise.all(reservation.seats.map(async (seat) => {
            this.logger.debug('Confirming seat:', {
              seatNumber: seat.seatNumber,
              trainId: reservation.schedule.train.trainID
            });
            
            await this.seatsService.confirmReservation(
              String(reservation.schedule.train.trainID),
              reservation.travelDate.toISOString().split('T')[0],
              reservation.schedule.departureTime,
              seat.seatNumber,
              reservation.userId
            );
            
            this.logger.debug('Seat confirmed successfully:', seat.seatNumber);
          }));
        } catch (error) {
          this.logger.error('Error confirming seats after payment:', error);
          throw new Error('Failed to confirm seats after payment');
        }
      } else if (updatedPayment.status === PaymentStatus.FAILED) {
        reservation.status = ReservationStatus.CANCELLED;
        
        // Release all seats if payment failed
        try {
          await Promise.all(reservation.seats.map(seat => 
            this.seatsService.releaseSeat(
              String(reservation.schedule.train.trainID),
              reservation.travelDate.toISOString().split('T')[0],
              reservation.schedule.departureTime,
              seat.seatNumber,
              reservation.userId
            )
          ));
        } catch (error) {
          this.logger.error('Error releasing seats after failed payment:', error);
        }
      }

      // Update the payment reference in the reservation object
      reservation.payment = updatedPayment;

      // Save and re-fetch
      const updatedReservation = await this.reservationRepository.save(reservation) as Reservation;

      this.logger.log('Reservation status updated:', {
        reservationId: updatedReservation.id,
        status: updatedReservation.status,
        paymentStatus: updatedReservation.payment.status
      });

      return this.findOne(updatedReservation.id);
    } catch (error) {
      this.logger.error('Error updating payment status:', error);
      throw error;
    }
  }

  async findAllForAdmin(): Promise<ReservationWithSeat[]> {
    // Load seats relation
    const reservations = await this.reservationRepository.find({
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket', 'seats'],
      order: { createdAt: 'DESC' }
    });

    // Return reservations with loaded seats, cast to ReservationWithSeat array
    return reservations as ReservationWithSeat[];
  }
}
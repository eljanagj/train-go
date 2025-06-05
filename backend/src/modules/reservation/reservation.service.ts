import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { SeatsService } from '../seats/seats.service';
import { PaymentService } from '../payment/payment.service';
import { Seat } from '../seats/entities/seat.entity';
import { Schedule } from '../schedule/schedule.entity';
import { Payment, PaymentStatus } from '../payment/entities/payment.entity';
import { TicketService } from '../ticket/ticket.service';

// Simplified interface - Reservation entity now directly includes seats relation
export interface ReservationWithSeat extends Reservation {
  clientSecret?: string;
}

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private seatsService: SeatsService,
    private paymentService: PaymentService,
    private ticketService: TicketService,
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

      const allSeats = await this.seatsService.getAllSeatsForTrain(schedule.train.trainID);

      const requestedSeats = createReservationDto.seatNumbers.map(seatNumber => {
        const seat = allSeats.find(s => s.seatNumber === seatNumber);
        if (!seat) {
          throw new BadRequestException(`Seat ${seatNumber} not found`);
        }
        if (seat.status !== 'available') {
          throw new BadRequestException(`Seat ${seatNumber} is not available`);
        }
        return seat;
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
        reservationDate: createReservationDto.reservationDate,
        discountCode: createReservationDto.discountCode,
        status: ReservationStatus.PAYMENT_PENDING,
        price: totalPrice,
        // Assign the requested seats to the reservation entity
        seats: requestedSeats,
      } as Partial<Reservation>);

      // Save the reservation to the database. TypeORM should return the saved entity.
      const savedReservation = await this.reservationRepository.save(reservation);

      // Create payment for the reservation
      const payment = await this.paymentService.createPayment(savedReservation.id, totalPrice);

      console.log('Creating reservation with payment:', {
        reservationId: savedReservation.id,
        paymentId: payment.id,
        totalPrice,
        seatNumbers: createReservationDto.seatNumbers // Log selected seat numbers
      });

      // Mark all selected seats as reserved
      try {
        await Promise.all(requestedSeats.map(seat => this.seatsService.reserveSeat(seat.id)));
      } catch (error) {
        // Rollback reservation if seat reservation fails
        await this.reservationRepository.remove(savedReservation);
        console.error('Error reserving one or more seats:', error);
        throw error; // Re-throw to indicate failure
      }

      // Return the created reservation with payment details and associated seats
      // savedReservation entity should now have the seats array loaded
      const result: ReservationWithSeat = {
        ...savedReservation,
        clientSecret: payment.paymentIntentId ? `${payment.paymentIntentId}_secret_placeholder` : undefined
      };

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

    // Release all associated seats
    if (reservation.seats && reservation.seats.length > 0) {
      await Promise.all(reservation.seats.map(seat => this.seatsService.releaseSeat(seat.id)));
    }

    // Remove the reservation
    await this.reservationRepository.remove(reservation as Reservation);
  }

  async cancelReservation(id: string): Promise<ReservationWithSeat> {
    // Load seats relation to release them
    const reservation = await this.findOne(id);

    // Release all associated seats
    if (reservation.seats && reservation.seats.length > 0) {
      await Promise.all(reservation.seats.map(seat => this.seatsService.releaseSeat(seat.id)));
    }

    reservation.status = ReservationStatus.CANCELLED;
    // Save and return - assert save result
    const cancelledReservation = await this.reservationRepository.save(reservation) as Reservation;

    // Re-fetch to ensure relations are loaded for the return type
    return this.findOne(cancelledReservation.id);
  }

  async confirmReservation(id: string): Promise<ReservationWithSeat> {
    // Load seats relation
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDING && reservation.status !== ReservationStatus.PAYMENT_PENDING) { // Allow confirming from PAYMENT_PENDING too
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
            // Use confirmedReservation.id
            const ticket = await this.ticketService.createTicket(confirmedReservation.id);
             console.log('Ticket created automatically:', {
               ticketId: ticket.id,
               ticketNumber: ticket.ticketNumber,
               reservationId: confirmedReservation.id
             });
          }
        } catch (error) {
          console.error('Error creating ticket after payment confirmation:', error);
          // Don't fail the payment confirmation if ticket creation fails
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
    // Load seats relation
    const reservation = await this.findOne(id);

    if (!reservation.payment) {
      throw new BadRequestException('No payment found for this reservation');
    }

    // Update payment status through PaymentService
    const updatedPayment = await this.paymentService.updatePaymentStatus(reservation.payment.id, paymentIntentId);

    console.log('Payment status updated:', {
      paymentId: updatedPayment.id,
      status: updatedPayment.status,
      reservationId: id,
      paymentDate: updatedPayment.paymentDate
    });

    // Update reservation status based on payment status
    if (updatedPayment.status === PaymentStatus.COMPLETED) {
      reservation.status = ReservationStatus.CONFIRMED;
      console.log('Payment confirmed, updating reservation status to CONFIRMED');

      /*// Automatically create ticket when payment is confirmed (if not already created)
      try {
        // Check if ticket already exists to avoid duplicates
        const existingTicket = await this.ticketService.findByReservationId(reservation.id);
        if (!existingTicket) {
          const ticket = await this.ticketService.createTicket(reservation.id);
           console.log('Ticket created automatically:', {
             ticketId: ticket.id,
             ticketNumber: ticket.ticketNumber,
             reservationId: reservation.id
           });
        }
      } catch (error) {
        console.error('Error creating ticket after payment confirmation:', error);
        // Don't fail the payment confirmation if ticket creation fails
      } */
    } else if (updatedPayment.status === PaymentStatus.FAILED) {
      reservation.status = ReservationStatus.CANCELLED;
      console.log('Payment failed, updating reservation status to CANCELLED');
    }

    // Update the payment reference in the reservation object to reflect the new status
    reservation.payment = updatedPayment;

    // Save and re-fetch - assert save result
    const updatedReservation = await this.reservationRepository.save(reservation) as Reservation;

    console.log('Reservation status updated:', {
      reservationId: updatedReservation.id,
      status: updatedReservation.status,
      paymentStatus: updatedReservation.payment.status
    });

    // Re-fetch to ensure relations are loaded for the return type
    return this.findOne(updatedReservation.id);
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
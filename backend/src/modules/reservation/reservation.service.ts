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

export interface ReservationWithSeat extends Reservation {
  seat?: Seat;
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
  ) {}

  async create(createReservationDto: CreateReservationDto): Promise<ReservationWithSeat> {
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
      const requestedSeat = allSeats.find(seat => seat.seatNumber === createReservationDto.seatNumber);

      if (!requestedSeat) {
        throw new BadRequestException(`Seat ${createReservationDto.seatNumber} not found`);
      }

      if (requestedSeat.status !== 'available') {
        throw new BadRequestException(`Seat ${createReservationDto.seatNumber} is not available`);
      }

      const totalPrice = Number(requestedSeat.price) + Number(schedule.route.price);

      // Create the reservation first
      const reservation = this.reservationRepository.create({
        ...createReservationDto,
        status: ReservationStatus.PAYMENT_PENDING,
        price: totalPrice,
      });

      const savedReservation = await this.reservationRepository.save(reservation);

      // Create payment for the reservation
      const payment = await this.paymentService.createPayment(savedReservation.id, totalPrice);

      console.log('Creating reservation with payment:', {
        reservationId: savedReservation.id,
        paymentId: payment.id,
        totalPrice
      });

      try {
        await this.seatsService.reserveSeat(requestedSeat.id);
      } catch (error) {
        await this.reservationRepository.remove(savedReservation);
        console.error('Error reserving seat:', error);
        throw error;
      }

      return {
        ...savedReservation,
        seat: requestedSeat,
        clientSecret: payment.paymentIntentId ? `${payment.paymentIntentId}_secret_placeholder` : undefined
      };
    } catch (error) {
      console.error('Error in ReservationService.create:', error);
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Failed to create reservation: ' + (error.message || error));
    }
  }

  async findAll(): Promise<ReservationWithSeat[]> {
    const reservations = await this.reservationRepository.find({
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket'],
    });

    // Get seat details for each reservation through the chain
    const reservationsWithSeats = await Promise.all(
      reservations.map(async (reservation) => {
        const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
        const seatDetails = availableSeats.find(seat => seat.seatNumber === reservation.seatNumber);
        return {
          ...reservation,
          seat: seatDetails
        };
      })
    );

    return reservationsWithSeats;
  }

  async findOne(id: string): Promise<ReservationWithSeat> {
    const reservation = await this.reservationRepository.findOne({
      where: { id },
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket'],
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    // Get seat details through the chain
    const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
    const seatDetails = availableSeats.find(seat => seat.seatNumber === reservation.seatNumber);

    return {
      ...reservation,
      seat: seatDetails
    };
  }

  async update(id: string, updateReservationDto: UpdateReservationDto): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id);
    Object.assign(reservation, updateReservationDto);
    return await this.reservationRepository.save(reservation);
  }

  async remove(id: string): Promise<void> {
    const reservation = await this.findOne(id);

    // Get the seat through the chain and release it
    const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
    const seat = availableSeats.find(s => s.seatNumber === reservation.seatNumber);
    if (seat) {
      await this.seatsService.releaseSeat(seat.id);
    }

    await this.reservationRepository.remove(reservation);
  }

  async cancelReservation(id: string): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id);

    // Get the seat through the chain and release it
    const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
    const seat = availableSeats.find(s => s.seatNumber === reservation.seatNumber);
    if (seat) {
      await this.seatsService.releaseSeat(seat.id);
    }

    reservation.status = ReservationStatus.CANCELLED;
    return await this.reservationRepository.save(reservation);
  }

  async confirmReservation(id: string): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id);

    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException('Only pending reservations can be confirmed');
    }

    reservation.status = ReservationStatus.CONFIRMED;
    return await this.reservationRepository.save(reservation);
  }

  async getReservationsBySchedule(scheduleId: number): Promise<ReservationWithSeat[]> {
    const reservations = await this.reservationRepository.find({
      where: { scheduleId },
      relations: ['schedule', 'schedule.train', 'user'],
    });

    // Get seat details for each reservation through the chain
    const reservationsWithSeats = await Promise.all(
      reservations.map(async (reservation) => {
        const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
        const seatDetails = availableSeats.find(seat => seat.seatNumber === reservation.seatNumber);
        return {
          ...reservation,
          seat: seatDetails
        };
      })
    );

    return reservationsWithSeats;
  }

  async getAvailableSeatsForSchedule(scheduleId: number): Promise<Seat[]> {
    // Get the schedule to find the train
    const schedule = await this.reservationRepository
      .createQueryBuilder('reservation')
      .leftJoinAndSelect('reservation.schedule', 'schedule')
      .leftJoinAndSelect('schedule.train', 'train')
      .where('schedule.id = :scheduleId', { scheduleId })
      .getOne();

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${scheduleId} not found`);
    }

    // Get available seats for the train
    return await this.seatsService.getAvailableSeats(schedule.schedule.train.trainID);
  }

  async findBySchedule(scheduleId: number): Promise<ReservationWithSeat[]> {
    return this.getReservationsBySchedule(scheduleId);
  }

  async updatePaymentStatus(id: string, paymentIntentId: string): Promise<ReservationWithSeat> {
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

      // TODO: Create ticket automatically when payment is confirmed
      // Temporarily disabled to fix payment confirmation issue
      // try {
      //   const ticket = await this.ticketService.createTicket(id);
      //   console.log('Ticket created automatically:', {
      //     ticketId: ticket.id,
      //     ticketNumber: ticket.ticketNumber,
      //     reservationId: id
      //   });
      // } catch (error) {
      //   console.error('Error creating ticket after payment confirmation:', error);
      //   // Don't fail the payment confirmation if ticket creation fails
      // }
    } else if (updatedPayment.status === PaymentStatus.FAILED) {
      reservation.status = ReservationStatus.CANCELLED;
      console.log('Payment failed, updating reservation status to CANCELLED');
    }

    // Update the payment reference in the reservation object to reflect the new status
    reservation.payment = updatedPayment;

    const updatedReservation = await this.reservationRepository.save(reservation);

    console.log('Reservation status updated:', {
      reservationId: updatedReservation.id,
      status: updatedReservation.status,
      paymentStatus: updatedReservation.payment.status
    });

    // Return the reservation with seat information and updated payment data
    return {
      ...updatedReservation,
      seat: await this.getSeatForReservation(updatedReservation)
    };
  }

  async findAllForAdmin(): Promise<ReservationWithSeat[]> {
    const reservations = await this.reservationRepository.find({
      relations: ['schedule', 'schedule.train', 'schedule.route', 'user', 'payment', 'ticket'],
      order: { createdAt: 'DESC' }
    });

    // Get seat details for each reservation
    const reservationsWithSeats = await Promise.all(
      reservations.map(async (reservation) => {
        const seat = await this.getSeatForReservation(reservation);
        return {
          ...reservation,
          seat
        };
      })
    );

    return reservationsWithSeats;
  }

  private async getSeatForReservation(reservation: Reservation): Promise<any> {
    try {
      const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
      return availableSeats.find(s => s.seatNumber === reservation.seatNumber) || null;
    } catch (error) {
      console.warn('Could not fetch seat information for reservation:', error);
      return null;
    }
  }
}
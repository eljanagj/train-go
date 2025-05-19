import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reservation, ReservationStatus } from './entities/reservation.entity';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { SeatsService } from '../seats/seats.service';
import { Seat } from '../seats/entities/seat.entity';
import { Schedule } from '../schedule/schedule.entity';

export interface ReservationWithSeat extends Reservation {
  seat?: Seat;
}

@Injectable()
export class ReservationService {
  constructor(
    @InjectRepository(Reservation)
    private reservationRepository: Repository<Reservation>,
    @InjectRepository(Schedule)
    private scheduleRepository: Repository<Schedule>,
    private seatsService: SeatsService,
  ) {}

  async create(createReservationDto: CreateReservationDto, userId: string): Promise<ReservationWithSeat> {
    // Get schedule with route to find the train and route price
    const schedule = await this.scheduleRepository.findOne({
      where: { id: createReservationDto.scheduleId },
      relations: ['train', 'route']
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${createReservationDto.scheduleId} not found`);
    }

    // Get available seats for the train
    const availableSeats = await this.seatsService.getAvailableSeats(schedule.train.trainID);
    
    // Find the requested seat
    const requestedSeat = availableSeats.find(seat => seat.seatNumber === createReservationDto.seatNumber);
    
    if (!requestedSeat) {
      throw new BadRequestException(`Seat ${createReservationDto.seatNumber} is not available`);
    }

    // Calculate total price (seat price + route price)
    const totalPrice = Number(requestedSeat.price) + Number(schedule.route.price);

    // Reserve the seat
    await this.seatsService.reserveSeat(requestedSeat.id);

    // Create the reservation with calculated total price
    const reservation = this.reservationRepository.create({
      ...createReservationDto,
      userId,
      status: ReservationStatus.PENDING,
      price: totalPrice
    });

    const savedReservation = await this.reservationRepository.save(reservation);
    return {
      ...savedReservation,
      seat: requestedSeat
    };
  }

  async findAll(userId: string): Promise<ReservationWithSeat[]> {
    const reservations = await this.reservationRepository.find({
      where: { userId },
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

  async findOne(id: string, userId: string): Promise<ReservationWithSeat> {
    const reservation = await this.reservationRepository.findOne({
      where: { id, userId },
      relations: ['schedule', 'schedule.train', 'user'],
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

  async update(id: string, updateReservationDto: UpdateReservationDto, userId: string): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id, userId);
    Object.assign(reservation, updateReservationDto);
    return await this.reservationRepository.save(reservation);
  }

  async remove(id: string, userId: string): Promise<void> {
    const reservation = await this.findOne(id, userId);
    
    // Get the seat through the chain and release it
    const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
    const seat = availableSeats.find(s => s.seatNumber === reservation.seatNumber);
    if (seat) {
      await this.seatsService.releaseSeat(seat.id);
    }
    
    await this.reservationRepository.remove(reservation);
  }

  async cancelReservation(id: string, userId: string): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id, userId);
    
    // Get the seat through the chain and release it
    const availableSeats = await this.seatsService.getAvailableSeats(reservation.schedule.train.trainID);
    const seat = availableSeats.find(s => s.seatNumber === reservation.seatNumber);
    if (seat) {
      await this.seatsService.releaseSeat(seat.id);
    }
    
    reservation.status = ReservationStatus.CANCELLED;
    return await this.reservationRepository.save(reservation);
  }

  async confirmReservation(id: string, userId: string): Promise<ReservationWithSeat> {
    const reservation = await this.findOne(id, userId);
    
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
} 
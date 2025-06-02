import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Seat, SeatStatus, SeatType, SeatClass } from './entities/seat.entity';
import { Train } from '../train/entities/train.entity';

@Injectable()
export class SeatsService {
  constructor(
    @InjectRepository(Seat)
    private seatRepository: Repository<Seat>,
    @InjectRepository(Train)
    private trainRepository: Repository<Train>,
  ) {}

  async createSeatsForTrain(trainId: number, seatConfig: {
    seatNumber: string;
    type: SeatType;
    price: number;
    location: string;
    row: number;
    position: string;
    class: SeatClass;
  }[]): Promise<Seat[]> {
    const train = await this.trainRepository.findOne({ where: { trainID: trainId } });
    if (!train) {
      throw new NotFoundException(`Train with ID ${trainId} not found`);
    }

    const seats = seatConfig.map(config => 
      this.seatRepository.create({
        ...config,
        trainId,
        status: SeatStatus.AVAILABLE
      })
    );

    const savedSeats = await this.seatRepository.save(seats);
    
    // Update train's total capacity and available seats (consider existing seats)
    const existingSeatsCount = await this.seatRepository.count({ where: { trainId: trainId } as FindOptionsWhere<Seat> });
    train.totalCapacity = existingSeatsCount;
    train.availableSeats = await this.seatRepository.count({ where: { trainId: trainId, status: SeatStatus.AVAILABLE } as FindOptionsWhere<Seat> });
    await this.trainRepository.save(train);

    return savedSeats;
  }

  async getAvailableSeats(trainId: number): Promise<Seat[]> {
    return await this.seatRepository.find({
      where: {
        trainId: trainId,
        status: SeatStatus.AVAILABLE
      } as FindOptionsWhere<Seat>
    });
  }

  async getAllSeatsForTrain(trainId: number): Promise<Seat[]> {
    return await this.seatRepository.find({
      where: {
        trainId: trainId,
      } as FindOptionsWhere<Seat>
    });
  }

  async reserveSeat(seatId: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['train']
    });

    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }

    if (seat.status !== SeatStatus.AVAILABLE) {
      throw new BadRequestException('Seat is not available');
    }

    seat.status = SeatStatus.RESERVED;
    const updatedSeat = await this.seatRepository.save(seat);

    // Update train's available seats count
    const train = seat.train;
    if (train) {
      train.availableSeats = await this.seatRepository.count({ where: { trainId: train.trainID, status: SeatStatus.AVAILABLE } as FindOptionsWhere<Seat> });
      await this.trainRepository.save(train);
    }

    return updatedSeat;
  }

  async releaseSeat(seatId: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['train']
    });

    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }

    seat.status = SeatStatus.AVAILABLE;
    const updatedSeat = await this.seatRepository.save(seat);

    // Update train's available seats count
    const train = seat.train;
    if (train) {
      train.availableSeats = await this.seatRepository.count({ where: { trainId: train.trainID, status: SeatStatus.AVAILABLE } as FindOptionsWhere<Seat> });
      await this.trainRepository.save(train);
    }

    return updatedSeat;
  }

  async getSeatDetails(seatId: string): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['train']
    });

    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }

    return seat;
  }

  async deleteSeat(seatId: string): Promise<void> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId },
      relations: ['train']
    });

    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }

    // Update train's total capacity and available seats
    const train = seat.train;
    if (train) {
      train.totalCapacity = await this.seatRepository.count({ where: { trainId: train.trainID } as FindOptionsWhere<Seat> });
      train.availableSeats = await this.seatRepository.count({ where: { trainId: train.trainID, status: SeatStatus.AVAILABLE } as FindOptionsWhere<Seat> });
      await this.trainRepository.save(train);
    }

    // Delete the seat
    await this.seatRepository.remove(seat);
  }

  async updateSeatPrice(seatId: string, price: number): Promise<Seat> {
    const seat = await this.seatRepository.findOne({
      where: { id: seatId }
    });

    if (!seat) {
      throw new NotFoundException(`Seat with ID ${seatId} not found`);
    }

    seat.price = price;
    return await this.seatRepository.save(seat);
  }
} 
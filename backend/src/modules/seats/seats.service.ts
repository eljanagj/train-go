import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Seat,
  SeatClass,
  SeatStatus,
  SeatType,
} from './entities/seat.entity';
import { ScheduleSeatStatus } from './entities/schedule-seat-status.entity';

export interface SeatData {
  type: string;
  class: string;
  price: number;
  location: string;
  row: number;
  position: string;
  status?: string;
}

interface SeatConfigInput {
  seatNumber: string;
  type: string;
  class: string;
  price: number;
  location: string;
  row: number;
  position: string;
}

@Injectable()
export class SeatsService {
  private readonly logger = new Logger(SeatsService.name);

  constructor(
    @InjectRepository(Seat)
    private readonly seatRepo: Repository<Seat>,
    @InjectRepository(ScheduleSeatStatus)
    private readonly scheduleSeatRepo: Repository<ScheduleSeatStatus>,
  ) {}

  private normalizeDate(date: string): string {
    return date.includes('T') ? date.split('T')[0] : date;
  }

  private toSeatType(type: string): SeatType {
    const value = type?.toLowerCase() as SeatType;
    if (Object.values(SeatType).includes(value)) {
      return value;
    }
    return SeatType.MIDDLE;
  }

  private toSeatClass(seatClass: string): SeatClass {
    const value = seatClass?.toLowerCase() as SeatClass;
    if (Object.values(SeatClass).includes(value)) {
      return value;
    }
    return SeatClass.ECONOMY;
  }

  private seatToData(seat: Seat, status?: string): SeatData {
    return {
      type: seat.type,
      class: seat.class,
      price: Number(seat.price),
      location: seat.location,
      row: seat.row,
      position: seat.position,
      status: status ?? seat.status,
    };
  }

  async createSeatsForTrain(trainId: number, seatConfig: SeatConfigInput[]) {
    for (const config of seatConfig) {
      const existing = await this.seatRepo.findOne({
        where: { trainId, seatNumber: config.seatNumber },
      });

      if (existing) {
        existing.type = this.toSeatType(config.type);
        existing.class = this.toSeatClass(config.class);
        existing.price = config.price;
        existing.location = config.location;
        existing.row = config.row;
        existing.position = config.position;
        existing.status = SeatStatus.AVAILABLE;
        await this.seatRepo.save(existing);
      } else {
        await this.seatRepo.save(
          this.seatRepo.create({
            trainId,
            seatNumber: config.seatNumber,
            type: this.toSeatType(config.type),
            class: this.toSeatClass(config.class),
            price: config.price,
            location: config.location,
            row: config.row,
            position: config.position,
            status: SeatStatus.AVAILABLE,
          }),
        );
      }
    }

    const totalSeats = await this.seatRepo.count({ where: { trainId } });
    this.logger.log(`Saved ${seatConfig.length} seat(s) for train ${trainId} in PostgreSQL`);

    return {
      message: 'Seat configuration saved to database',
      totalSeats,
    };
  }

  private async ensureScheduleStatuses(
    trainId: number,
    date: string,
    time: string,
    seatNumbers: string[],
  ) {
    const travelDate = this.normalizeDate(date);
    const existing = await this.scheduleSeatRepo.find({
      where: { trainId, travelDate, departureTime: time },
    });
    const existingNumbers = new Set(existing.map((s) => s.seatNumber));

    const toCreate = seatNumbers
      .filter((n) => !existingNumbers.has(n))
      .map((seatNumber) =>
        this.scheduleSeatRepo.create({
          trainId,
          travelDate,
          departureTime: time,
          seatNumber,
          status: 'available',
        }),
      );

    if (toCreate.length > 0) {
      await this.scheduleSeatRepo.save(toCreate);
    }
  }

  async getAvailableSeats(trainId: number, date: string, time: string) {
    const seats = await this.seatRepo.find({ where: { trainId } });
    if (seats.length === 0) {
      return [];
    }

    const travelDate = this.normalizeDate(date);
    await this.ensureScheduleStatuses(
      trainId,
      travelDate,
      time,
      seats.map((s) => s.seatNumber),
    );

    const statuses = await this.scheduleSeatRepo.find({
      where: { trainId, travelDate, departureTime: time },
    });
    const statusMap = new Map(statuses.map((s) => [s.seatNumber, s.status]));

    return seats
      .filter((seat) => (statusMap.get(seat.seatNumber) ?? 'available') === 'available')
      .map((seat) => seat.seatNumber);
  }

  async reserveSeat(
    trainId: string,
    date: string,
    time: string,
    seatId: string,
    userId: string,
  ): Promise<void> {
    const travelDate = this.normalizeDate(date);
    await this.ensureScheduleStatuses(Number(trainId), travelDate, time, [seatId]);

    const record = await this.scheduleSeatRepo.findOne({
      where: {
        trainId: Number(trainId),
        travelDate,
        departureTime: time,
        seatNumber: seatId,
      },
    });

    if (!record || record.status !== 'available') {
      throw new Error(`Seat ${seatId} is not available`);
    }

    record.status = 'reserved';
    await this.scheduleSeatRepo.save(record);
  }

  async confirmReservation(
    trainId: string,
    date: string,
    time: string,
    seatId: string,
    userId: string,
  ) {
    const travelDate = this.normalizeDate(date);
    const record = await this.scheduleSeatRepo.findOne({
      where: {
        trainId: Number(trainId),
        travelDate,
        departureTime: time,
        seatNumber: seatId,
      },
    });

    if (!record || record.status !== `pending:${userId}`) {
      throw new ConflictException('Cannot confirm: seat not pending for this user');
    }

    record.status = 'reserved';
    await this.scheduleSeatRepo.save(record);
    return { message: 'Reservation confirmed' };
  }

  async releaseSeat(
    trainId: string,
    date: string,
    time: string,
    seatId: string,
    _userId: string,
  ): Promise<void> {
    const travelDate = this.normalizeDate(date);
    const record = await this.scheduleSeatRepo.findOne({
      where: {
        trainId: Number(trainId),
        travelDate,
        departureTime: time,
        seatNumber: seatId,
      },
    });

    if (!record) {
      throw new Error(`Seat ${seatId} not found for this schedule`);
    }

    record.status = 'available';
    await this.scheduleSeatRepo.save(record);
  }

  async getSeatDetails(trainId: string, date?: string, time?: string) {
    const seats = await this.seatRepo.find({
      where: { trainId: Number(trainId) },
      order: { row: 'ASC', seatNumber: 'ASC' },
    });

    if (seats.length === 0) {
      return {};
    }

    if (!date || !time) {
      return seats.reduce<Record<string, SeatData>>((acc, seat) => {
        acc[seat.seatNumber] = this.seatToData(seat, 'available');
        return acc;
      }, {});
    }

    const travelDate = this.normalizeDate(date);
    await this.ensureScheduleStatuses(
      Number(trainId),
      travelDate,
      time,
      seats.map((s) => s.seatNumber),
    );

    const statuses = await this.scheduleSeatRepo.find({
      where: {
        trainId: Number(trainId),
        travelDate,
        departureTime: time,
      },
    });
    const statusMap = new Map(statuses.map((s) => [s.seatNumber, s.status]));

    return seats.reduce<Record<string, SeatData>>((acc, seat) => {
      acc[seat.seatNumber] = this.seatToData(
        seat,
        statusMap.get(seat.seatNumber) ?? 'available',
      );
      return acc;
    }, {});
  }

  async deleteSeats(trainId: string, seatNumbers: string[]): Promise<void> {
    if (seatNumbers.length === 0) return;

    await this.seatRepo.delete({
      trainId: Number(trainId),
      seatNumber: In(seatNumbers),
    });

    await this.scheduleSeatRepo.delete({
      trainId: Number(trainId),
      seatNumber: In(seatNumbers),
    });
  }

  async updateSeatPrice(
    trainId: string,
    seatNumber: string,
    price: number,
  ): Promise<void> {
    const seat = await this.seatRepo.findOne({
      where: { trainId: Number(trainId), seatNumber },
    });

    if (!seat) {
      throw new NotFoundException('Seat not found');
    }

    seat.price = price;
    await this.seatRepo.save(seat);
  }
}

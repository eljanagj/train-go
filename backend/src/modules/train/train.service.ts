import {
    Injectable,
    NotFoundException,
    BadRequestException,
    Logger
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Train } from './entities/train.entity';
  import { TrainStatus } from './entities/train-status.enum';
//  import { TrainStatusHistory } from './entities/train-status-history.entity';
  import { CreateTrainDto } from './dto/create-train.dto';
  import { UpdateTrainDto } from './dto/update-train.dto';
  import { SeatsService, SeatData } from '../seats/seats.service';

  interface SeatWithNumber extends SeatData {
    seatNumber: string;
  }

  @Injectable()
  export class TrainService {
    private readonly logger = new Logger(TrainService.name);

    // Define allowed status transitions in one place
    private static readonly VALID_TRANSITIONS: Record<TrainStatus, TrainStatus[]> = {
      [TrainStatus.ACTIVE]:         [TrainStatus.DECOMMISSIONED],
      [TrainStatus.DECOMMISSIONED]: [],
    };

    constructor(
      @InjectRepository(Train)
      private readonly trainRepo: Repository<Train>,
      private readonly seatsService: SeatsService,
    ) {}

    async create(dto: CreateTrainDto): Promise<Train> {
      const train = this.trainRepo.create({
        ...dto,
        status: TrainStatus.ACTIVE
      });
      return this.trainRepo.save(train);
    }

    async findAll(): Promise<Train[]> {
      const trains = await this.trainRepo.find();
      return Promise.all(trains.map(train => this.updateTrainCapacity(train)));
    }

    async findOne(id: number): Promise<Train> {
      const train = await this.trainRepo.findOne({
        where: { trainID: id },
       // relations: ['statusHistory'],
      });
      if (!train) {
        throw new NotFoundException(`Train with ID ${id} not found`);
      }
      return this.updateTrainCapacity(train);
    }

    async update(id: number, dto: UpdateTrainDto): Promise<Train> {
      const { status, ...safeDto } = dto as any;

      if (status !== undefined) {
        throw new BadRequestException(
          'Status cannot be updated via general update. Use the dedicated status endpoint.',
        );
      }

      await this.trainRepo.update(id, safeDto);
      return this.findOne(id);
    }

    async remove(id: number): Promise<void> {
      const result = await this.trainRepo.delete(id);
      if (result.affected === 0) {
        throw new NotFoundException(`Train with ID ${id} not found`);
      }
    }


    async updateStatus(
      id: number,
      newStatus: TrainStatus,
    ): Promise<Train> {
      const train = await this.findOne(id);
      const allowed = TrainService.VALID_TRANSITIONS[train.status] || [];

      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Cannot transition from ${train.status} to ${newStatus}`,
        );
      }

      train.status = newStatus;
      return this.trainRepo.save(train);
    }

    private async updateTrainCapacity(train: Train): Promise<Train> {
      try {
        const seats = await this.seatsService.getSeatDetails(train.trainID.toString());
        const seatArray = Object.values(seats) as SeatData[];
        
        train.totalCapacity = seatArray.length;
        train.availableSeats = seatArray.filter(seat => seat.status === 'available').length;

        return this.trainRepo.save(train);
      } catch (error) {
        // If there's an error getting seats (e.g., no seats configured yet),
        // set capacity to 0
        train.totalCapacity = 0;
        train.availableSeats = 0;
        return this.trainRepo.save(train);
      }
    }

    async getAvailableSeats(trainId: number, date: string, time: string) {
      try {
        const seats = await this.seatsService.getSeatDetails(String(trainId), date, time);
        const seatArray: SeatWithNumber[] = Object.entries(seats).map(([seatNumber, seatData]) => {
          const seat = seatData as SeatData;
          return {
            seatNumber,
            type: seat.type,
            class: seat.class,
            price: seat.price,
            location: seat.location,
            row: seat.row,
            position: seat.position,
            status: seat.status || 'available'
          };
        });
        
        const train = await this.trainRepo.findOne({ where: { trainID: trainId } });
        if (!train) {
          throw new Error(`Train ${trainId} not found`);
        }

        train.availableSeats = seatArray.filter(seat => seat.status === 'available').length;
        await this.trainRepo.save(train);

        return seatArray;
      } catch (error) {
        this.logger.error(`Error getting available seats for train ${trainId}:`, error);
        throw error;
      }
    }
  }

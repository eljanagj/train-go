import {
    Injectable,
    NotFoundException,
    BadRequestException,
  } from '@nestjs/common';
  import { InjectRepository } from '@nestjs/typeorm';
  import { Repository } from 'typeorm';
  import { Train } from './entities/train.entity';
  import { TrainStatus } from './entities/train-status.enum';
//  import { TrainStatusHistory } from './entities/train-status-history.entity';
  import { CreateTrainDto } from './dto/create-train.dto';
  import { UpdateTrainDto } from './dto/update-train.dto';
  import { Seat, SeatStatus } from '../seats/entities/seat.entity';

  @Injectable()
  export class TrainService {
    // Define allowed status transitions in one place
    private static readonly VALID_TRANSITIONS: Record<TrainStatus, TrainStatus[]> = {
      [TrainStatus.ACTIVE]:         [TrainStatus.DECOMMISSIONED],
      [TrainStatus.DECOMMISSIONED]: [],
    };

    constructor(
      @InjectRepository(Train)
      private readonly trainRepo: Repository<Train>,
      @InjectRepository(Seat)
      private readonly seatRepo: Repository<Seat>,


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
      const seats = await this.seatRepo.find({
        where: { trainId: train.trainID }
      });

      train.totalCapacity = seats.length;
      train.availableSeats = seats.filter(seat => seat.status === SeatStatus.AVAILABLE).length;

      return this.trainRepo.save(train);
    }
  }

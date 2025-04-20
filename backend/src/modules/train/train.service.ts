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
  
  @Injectable()
  export class TrainService {
    // Define allowed status transitions in one place
    private static readonly VALID_TRANSITIONS: Record<TrainStatus, TrainStatus[]> = {
      [TrainStatus.ACTIVE]:      [TrainStatus.IN_TRANSIT, TrainStatus.MAINTENANCE, TrainStatus.DECOMMISSIONED],
      [TrainStatus.IN_TRANSIT]:  [TrainStatus.ARRIVED, TrainStatus.DELAYED],
      [TrainStatus.ARRIVED]:     [TrainStatus.IN_TRANSIT, TrainStatus.MAINTENANCE],
      [TrainStatus.DELAYED]:     [TrainStatus.IN_TRANSIT, TrainStatus.MAINTENANCE],
      [TrainStatus.MAINTENANCE]: [TrainStatus.ACTIVE, TrainStatus.DECOMMISSIONED],
      [TrainStatus.DECOMMISSIONED]: [],
    };
  
    constructor(
      @InjectRepository(Train)
      private readonly trainRepo: Repository<Train>,
  
      //@InjectRepository(TrainStatusHistory)
      //private readonly historyRepo: Repository<TrainStatusHistory>,
    ) {}
  
    async create(dto: CreateTrainDto): Promise<Train> {
      const train = this.trainRepo.create(dto);
      return this.trainRepo.save(train);
    }
  
    async findAll(): Promise<Train[]> {
      return this.trainRepo.find();
    }
  
    async findOne(id: number): Promise<Train> {
      const train = await this.trainRepo.findOne({
        where: { trainID: id },
       // relations: ['statusHistory'],
      });
      if (!train) {
        throw new NotFoundException(`Train with ID ${id} not found`);
      }
      return train;
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
  
    /**
     * Change a train's status, enforcing valid transitions
     * and recording an audit entry.
     */
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
  /*
      
     // Record history
      const history = this.historyRepo.create({
        train,
        fromStatus: train.status,
        toStatus: newStatus,
      });
      await this.historyRepo.save(history); 
      */
      // Update and return
      train.status = newStatus;
      return this.trainRepo.save(train);
    } 
  
  }
  
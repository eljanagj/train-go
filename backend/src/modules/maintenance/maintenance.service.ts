import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual, Not } from 'typeorm';
import { Maintenance, MaintenanceStatus, MaintenancePriority } from './entities/maintenance.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from './dto/update-maintenance.dto';
import { Train } from '../train/entities/train.entity';
import { TrainStatus } from '../train/entities/train-status.enum';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(Maintenance)
    private maintenanceRepository: Repository<Maintenance>,
    @InjectRepository(Train)
    private trainRepository: Repository<Train>,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto): Promise<Maintenance> {
    const train = await this.trainRepository.findOne({
      where: { trainID: createMaintenanceDto.trainId as unknown as number },
    });

    if (!train) {
      throw new NotFoundException(`Train with ID ${createMaintenanceDto.trainId} not found`);
    }

    const maintenance = this.maintenanceRepository.create({
      ...createMaintenanceDto,
      train,
    });

    const savedMaintenance = await this.maintenanceRepository.save(maintenance);

    // Update train status based on the initial maintenance status
    const trainToUpdate = await this.trainRepository.findOneBy({ trainID: savedMaintenance.train.trainID });
    if (trainToUpdate) {
      if (savedMaintenance.status === MaintenanceStatus.IN_PROGRESS || savedMaintenance.status === MaintenanceStatus.OUT_OF_SERVICE) {
        trainToUpdate.status = TrainStatus.DECOMMISSIONED;
        await this.trainRepository.save(trainToUpdate);
      } else if (savedMaintenance.status === MaintenanceStatus.COMPLETED) {
        trainToUpdate.status = TrainStatus.ACTIVE;
        await this.trainRepository.save(trainToUpdate);
      }
    }

    return savedMaintenance;
  }

  async findAll(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      relations: ['train'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Maintenance> {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
      relations: ['train'],
    });

    if (!maintenance) {
      throw new NotFoundException(`Maintenance record with ID ${id} not found`);
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto): Promise<Maintenance> {
    const maintenance = await this.findOne(id);

    if (updateMaintenanceDto.trainId) {
      const train = await this.trainRepository.findOne({
        where: { trainID: updateMaintenanceDto.trainId as unknown as number },
      });

      if (!train) {
        throw new NotFoundException(`Train with ID ${updateMaintenanceDto.trainId} not found`);
      }

      maintenance.train = train;
    }

    // Check if status is being updated
    if (updateMaintenanceDto.status) {
      // Update train status based on maintenance status
      const train = await this.trainRepository.findOneBy({ trainID: maintenance.train.trainID });
      if (train) {
        if (updateMaintenanceDto.status === MaintenanceStatus.IN_PROGRESS) {
          train.status = TrainStatus.DECOMMISSIONED;
        } else if (updateMaintenanceDto.status === MaintenanceStatus.COMPLETED) {
          train.status = TrainStatus.ACTIVE;
        } else if (updateMaintenanceDto.status === MaintenanceStatus.OUT_OF_SERVICE) {
          train.status = TrainStatus.DECOMMISSIONED;
        }
        await this.trainRepository.save(train);
      }
    }

    Object.assign(maintenance, updateMaintenanceDto);
    return this.maintenanceRepository.save(maintenance);
  }

  async remove(id: string): Promise<void> {
    const maintenance = await this.findOne(id);
    await this.maintenanceRepository.remove(maintenance);
  }

  async updateStatus(id: string, status: MaintenanceStatus): Promise<Maintenance> {
    const maintenance = await this.findOne(id);
    maintenance.status = status;

    // Update train status based on maintenance status
    if (status === MaintenanceStatus.IN_PROGRESS) {
      maintenance.train.status = TrainStatus.DECOMMISSIONED;
      await this.trainRepository.save(maintenance.train);
    } else if (status === MaintenanceStatus.COMPLETED) {
      maintenance.train.status = TrainStatus.ACTIVE;
      await this.trainRepository.save(maintenance.train);
    }

    return this.maintenanceRepository.save(maintenance);
  }

  async getTrainMaintenanceHistory(trainId: string): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { train: { trainID: parseInt(trainId) } },
      relations: ['train'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async getActiveMaintenance(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { status: MaintenanceStatus.IN_PROGRESS },
      relations: ['train'],
    });
  }

  async getMaintenanceByPriority(priority: MaintenancePriority): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: { priority },
      relations: ['train'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async getMaintenanceByDateRange(startDate: Date, endDate: Date): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      where: {
        scheduledDate: Between(startDate, endDate),
      },
      relations: ['train'],
      order: { scheduledDate: 'DESC' },
    });
  }

  async getUpcomingMaintenance(): Promise<Maintenance[]> {
    const today = new Date();
    return this.maintenanceRepository.find({
      where: {
        scheduledDate: MoreThanOrEqual(today),
        status: MaintenanceStatus.SCHEDULED,
      },
      relations: ['train'],
      order: { scheduledDate: 'ASC' },
      take: 5,
    });
  }

  async getMaintenanceStats() {
    const allMaintenance = await this.maintenanceRepository.find();
    
    return {
      operational: allMaintenance.filter(m => m.status === MaintenanceStatus.COMPLETED).length,
      underMaintenance: allMaintenance.filter(m => m.status === MaintenanceStatus.IN_PROGRESS).length,
      critical: allMaintenance.filter(m => m.priority === MaintenancePriority.HIGH).length,
      overdue: allMaintenance.filter(m => m.status === MaintenanceStatus.OVERDUE).length,
    };
  }

  async getMaintenanceTrends() {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    const maintenance = await this.maintenanceRepository.find();

    const completedByMonth = last6Months.map(month => {
      return maintenance.filter(m => 
        m.status === MaintenanceStatus.COMPLETED && 
        new Date(m.completedDate).toLocaleString('default', { month: 'short' }) === month
      ).length;
    });

    const pendingByMonth = last6Months.map(month => {
      return maintenance.filter(m => 
        (m.status === MaintenanceStatus.PENDING || m.status === MaintenanceStatus.IN_PROGRESS) && 
        new Date(m.scheduledDate).toLocaleString('default', { month: 'short' }) === month
      ).length;
    });

    return {
      labels: last6Months,
      completed: completedByMonth,
      pending: pendingByMonth,
    };
  }

  async getRecentActivity(): Promise<Maintenance[]> {
    return this.maintenanceRepository.find({
      relations: ['train'],
      order: { updatedAt: 'DESC' },
      take: 5,
    });
  }

  async checkOverdueMaintenance(): Promise<void> {
    const now = new Date();
    
    // Find all maintenance records that are not completed and have passed their scheduled date
    const overdueMaintenance = await this.maintenanceRepository.find({
      where: {
        scheduledDate: LessThanOrEqual(now),
        status: Not(MaintenanceStatus.COMPLETED),
      },
      relations: ['train'],
    });

    // Update each overdue record
    for (const maintenance of overdueMaintenance) {
      maintenance.status = MaintenanceStatus.OVERDUE;
      await this.maintenanceRepository.save(maintenance);
    }
  }
} 
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './schedule.entity';
import { Train } from '../train/entities/train.entity';
import { Route } from '../route/route.entity';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,

    @InjectRepository(Train)
    private readonly trainRepo: Repository<Train>,

    @InjectRepository(Route)
    private readonly routeRepo: Repository<Route>,
  ) {}

  async createSchedule(
    trainID: number,
    routeID: number,
    departureTime: Date,
    arrivalTime: Date,
  ): Promise<Schedule> {
    const train = await this.trainRepo.findOneBy({ trainID });
    if (!train) throw new NotFoundException('Train not found');

    const route = await this.routeRepo.findOneBy({ id: routeID });
    if (!route) throw new NotFoundException('Route not found');

    const schedule = this.scheduleRepo.create({
      train,
      route,
      departureTime,
      arrivalTime,
    });

    return this.scheduleRepo.save(schedule);
  }

  async getAll(): Promise<Schedule[]> {
    return this.scheduleRepo.find();
  }

  async getByTrain(trainID: number): Promise<Schedule[]> {
    return this.scheduleRepo.find({
      where: {
        train: {
          trainID,
        },
      },
    });
  }

  async deleteSchedule(id: number): Promise<void> {
    const result = await this.scheduleRepo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Schedule not found');
  }
}
